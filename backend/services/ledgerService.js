/**
 * Ledger Service — Double-Entry Accounting Engine for Digimess.
 *
 * RULES:
 * 1. Every financial movement creates balanced debit + credit entries.
 * 2. Balance is NEVER stored directly — always derived from entries.
 * 3. All operations run inside MySQL transactions.
 * 4. LedgerAccounts have NO balance column.
 */

const db = require('../config/db');
const crypto = require('crypto');
const { roundToPaise } = require('../utils/money');

// ─── Account Management ──────────────────────────────────────

/**
 * Create or retrieve a ledger account.
 * Uses INSERT IGNORE to handle concurrent creation safely.
 * @param {'CONSUMER_WALLET'|'VENDOR_WALLET'|'PLATFORM_ESCROW'|'PLATFORM_REVENUE'|'TAX_COLLECTED'|'REFUND_RESERVE'} accountType
 * @param {string|null} ownerId - userId, messId, or null for platform accounts
 * @param {'USER'|'MESS'|'PLATFORM'} ownerType
 * @param {object} [connection] - MySQL connection (if inside a transaction)
 * @returns {Promise<string>} accountId
 */
async function getOrCreateAccount(accountType, ownerId, ownerType, connection) {
  const conn = connection || db;

  // Try to find existing
  const [existing] = await conn.query(
    'SELECT id FROM LedgerAccounts WHERE accountType = ? AND (ownerId = ? OR (ownerId IS NULL AND ? IS NULL))',
    [accountType, ownerId, ownerId]
  );

  if (existing.length > 0) return existing[0].id;

  // Create new
  const id = crypto.randomUUID();
  await conn.query(
    'INSERT IGNORE INTO LedgerAccounts (id, accountType, ownerId, ownerType) VALUES (?, ?, ?, ?)',
    [id, accountType, ownerId, ownerType]
  );

  // Re-fetch in case of race condition (INSERT IGNORE + concurrent insert)
  const [rows] = await conn.query(
    'SELECT id FROM LedgerAccounts WHERE accountType = ? AND (ownerId = ? OR (ownerId IS NULL AND ? IS NULL))',
    [accountType, ownerId, ownerId]
  );

  return rows[0].id;
}

/**
 * Get a platform-level account (escrow, revenue, tax, refund reserve).
 * @param {'PLATFORM_ESCROW'|'PLATFORM_REVENUE'|'TAX_COLLECTED'|'REFUND_RESERVE'} accountType
 * @param {object} [connection]
 * @returns {Promise<string>} accountId
 */
async function getPlatformAccount(accountType, connection) {
  return getOrCreateAccount(accountType, null, 'PLATFORM', connection);
}

// ─── Transaction Management ──────────────────────────────────

/**
 * Create a ledger transaction record.
 * @param {object} params
 * @param {string} params.type - ORDER_PAYMENT, COMMISSION, etc.
 * @param {number} params.amount
 * @param {string} [params.referenceId] - orderId, subscriptionId, etc.
 * @param {string} [params.referenceType] - ORDER, SUBSCRIPTION, etc.
 * @param {string} [params.gatewayTransactionId]
 * @param {string} [params.idempotencyKey]
 * @param {object} [params.metadata]
 * @param {string} [params.status] - defaults to COMPLETED
 * @param {object} connection - MySQL connection (required — must be in a transaction)
 * @returns {Promise<string>} transactionId
 */
async function createTransaction(params, connection) {
  const {
    type,
    amount,
    referenceId = null,
    referenceType = null,
    gatewayTransactionId = null,
    idempotencyKey = null,
    metadata = null,
    status = 'COMPLETED',
  } = params;

  // Idempotency check
  if (idempotencyKey) {
    const [existing] = await connection.query(
      'SELECT id, status FROM LedgerTransactions WHERE idempotencyKey = ?',
      [idempotencyKey]
    );
    if (existing.length > 0) {
      return existing[0].id; // Already processed
    }
  }

  const id = crypto.randomUUID();
  await connection.query(
    `INSERT INTO LedgerTransactions (id, type, status, amount, referenceId, referenceType, gatewayTransactionId, idempotencyKey, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, type, status, roundToPaise(amount), referenceId, referenceType, gatewayTransactionId, idempotencyKey, metadata ? JSON.stringify(metadata) : null]
  );

  return id;
}

/**
 * Update a transaction's status.
 * @param {string} transactionId
 * @param {string} status - PENDING, COMPLETED, FAILED, REVERSED
 * @param {object} [connection]
 */
async function updateTransactionStatus(transactionId, status, connection) {
  const conn = connection || db;
  await conn.query('UPDATE LedgerTransactions SET status = ? WHERE id = ?', [status, transactionId]);
}

// ─── Double-Entry Ledger Entries ─────────────────────────────

/**
 * Create a balanced double-entry (one debit, one credit).
 * CRITICAL: debit amount MUST equal credit amount.
 *
 * @param {object} params
 * @param {string} params.debitAccountId - Account to debit
 * @param {string} params.creditAccountId - Account to credit
 * @param {number} params.amount - Must be > 0
 * @param {string} params.transactionId - Reference to LedgerTransactions
 * @param {string} [params.narration] - Human-readable description
 * @param {object} [params.metadata]
 * @param {string} [params.createdBy] - userId of who triggered this
 * @param {object} connection - MySQL connection (required — must be in a transaction)
 */
async function createDoubleEntry(params, connection) {
  const {
    debitAccountId,
    creditAccountId,
    amount,
    transactionId,
    narration = null,
    metadata = null,
    createdBy = null,
  } = params;

  const roundedAmount = roundToPaise(amount);
  if (roundedAmount <= 0) {
    throw new Error('Ledger entry amount must be positive');
  }

  const debitId = crypto.randomUUID();
  const creditId = crypto.randomUUID();
  const metaStr = metadata ? JSON.stringify(metadata) : null;

  // Insert debit entry
  await connection.query(
    `INSERT INTO LedgerEntries (id, transactionId, accountId, entryType, amount, narration, metadata, createdBy)
     VALUES (?, ?, ?, 'DEBIT', ?, ?, ?, ?)`,
    [debitId, transactionId, debitAccountId, roundedAmount, narration, metaStr, createdBy]
  );

  // Insert credit entry
  await connection.query(
    `INSERT INTO LedgerEntries (id, transactionId, accountId, entryType, amount, narration, metadata, createdBy)
     VALUES (?, ?, ?, 'CREDIT', ?, ?, ?, ?)`,
    [creditId, transactionId, creditAccountId, roundedAmount, narration, metaStr, createdBy]
  );
}

// ─── Balance & Entry Queries ─────────────────────────────────

/**
 * Get the current balance for a ledger account.
 * Balance = SUM(credits) - SUM(debits) from LedgerEntries.
 *
 * @param {string} accountId
 * @param {object} [connection]
 * @returns {Promise<number>}
 */
async function getBalance(accountId, connection) {
  const conn = connection || db;
  const [rows] = await conn.query(
    `SELECT
       (COALESCE(SUM(CASE WHEN entryType = 'CREDIT' THEN amount ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN entryType = 'DEBIT' THEN amount ELSE 0 END), 0)) AS balance
     FROM LedgerEntries
     WHERE accountId = ?`,
    [accountId]
  );
  return parseFloat(rows[0].balance) || 0;
}

/**
 * Get paginated ledger entries for an account.
 * @param {string} accountId
 * @param {object} [options]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @returns {Promise<{ entries: Array, total: number, page: number, totalPages: number }>}
 */
async function getEntries(accountId, options = {}) {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 20;
  const offset = (page - 1) * limit;

  const [[{ count }]] = await db.query(
    'SELECT COUNT(*) as count FROM LedgerEntries WHERE accountId = ?',
    [accountId]
  );

  const [entries] = await db.query(
    `SELECT le.*, lt.type AS transactionType, lt.status AS transactionStatus, lt.referenceId, lt.referenceType
     FROM LedgerEntries le
     JOIN LedgerTransactions lt ON le.transactionId = lt.id
     WHERE le.accountId = ?
     ORDER BY le.createdAt DESC
     LIMIT ? OFFSET ?`,
    [accountId, limit, offset]
  );

  return {
    entries,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
}

// ─── Integrity Verification ──────────────────────────────────

/**
 * Verify that a transaction's total debits equal total credits.
 * @param {string} transactionId
 * @returns {Promise<{ balanced: boolean, totalDebits: number, totalCredits: number }>}
 */
async function verifyTransactionIntegrity(transactionId) {
  const [rows] = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN entryType = 'DEBIT' THEN amount ELSE 0 END), 0) AS totalDebits,
       COALESCE(SUM(CASE WHEN entryType = 'CREDIT' THEN amount ELSE 0 END), 0) AS totalCredits
     FROM LedgerEntries
     WHERE transactionId = ?`,
    [transactionId]
  );

  const totalDebits = parseFloat(rows[0].totalDebits) || 0;
  const totalCredits = parseFloat(rows[0].totalCredits) || 0;

  return {
    balanced: Math.abs(totalDebits - totalCredits) < 0.01,
    totalDebits,
    totalCredits,
  };
}

/**
 * List all ledger accounts, optionally filtered by type.
 * @param {object} [options]
 * @param {string} [options.accountType]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @returns {Promise<{ accounts: Array, total: number }>}
 */
async function listAccounts(options = {}) {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 20;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (options.accountType) {
    whereClause += ' AND accountType = ?';
    params.push(options.accountType);
  }

  const [[{ count }]] = await db.query(
    `SELECT COUNT(*) as count FROM LedgerAccounts ${whereClause}`,
    params
  );

  const [accounts] = await db.query(
    `SELECT la.*,
       (SELECT COALESCE(SUM(CASE WHEN entryType='CREDIT' THEN amount ELSE 0 END), 0)
              - COALESCE(SUM(CASE WHEN entryType='DEBIT' THEN amount ELSE 0 END), 0)
        FROM LedgerEntries WHERE accountId = la.id) AS currentBalance
     FROM LedgerAccounts la
     ${whereClause}
     ORDER BY la.createdAt DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    accounts,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
}

module.exports = {
  getOrCreateAccount,
  getPlatformAccount,
  createTransaction,
  updateTransactionStatus,
  createDoubleEntry,
  getBalance,
  getEntries,
  verifyTransactionIntegrity,
  listAccounts,
};
