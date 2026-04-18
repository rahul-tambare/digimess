/**
 * Settlement Service — Vendor settlement orchestration for Digimess.
 *
 * Pipeline:
 * 1. Find vendors with eligible unsettled orders (delivered + past hold period)
 * 2. Calculate commission
 * 3. Create Settlement record
 * 4. Create ledger entries
 * 5. Initiate RazorpayX payout
 * 6. Handle webhook status updates
 */

const db = require('../config/db');
const crypto = require('crypto');
const ledgerService = require('./ledgerService');
const payoutService = require('./payoutService');
const { logAudit } = require('./auditService');
const { roundToPaise, calculateCommission, safeSubtract } = require('../utils/money');

/**
 * Get settlement config for a vendor, falling back to global AdminCharges.
 * @param {string} vendorId
 * @param {object} [connection]
 * @returns {Promise<{ commissionType: string, commissionAmount: number, holdPeriodDays: number, minSettlementAmount: number }>}
 */
async function getSettlementConfig(vendorId, connection) {
  const conn = connection || db;

  const [configRows] = await conn.query(
    'SELECT * FROM SettlementConfig WHERE vendorId = ? AND isActive = 1',
    [vendorId]
  );

  if (configRows.length > 0) {
    return {
      commissionType: configRows[0].commissionType,
      commissionAmount: parseFloat(configRows[0].commissionAmount),
      holdPeriodDays: configRows[0].holdPeriodDays || 2,
      minSettlementAmount: parseFloat(configRows[0].minSettlementAmount) || 100,
    };
  }

  // Fall back to global AdminCharges
  const [chargeRows] = await conn.query(
    "SELECT type, amount FROM AdminCharges WHERE appliesTo IN ('order', 'all') AND isActive = 1 LIMIT 1"
  );

  return {
    commissionType: chargeRows.length > 0 ? chargeRows[0].type : 'percentage',
    commissionAmount: chargeRows.length > 0 ? parseFloat(chargeRows[0].amount) : 10,
    holdPeriodDays: 2,
    minSettlementAmount: 100,
  };
}

/**
 * Trigger settlement for all eligible vendors.
 * @param {string} [initiatedBy='SYSTEM']
 * @param {string} [adminId=null]
 * @returns {Promise<{ created: number, skipped: number, errors: string[] }>}
 */
async function triggerSettlements(initiatedBy = 'SYSTEM', adminId = null) {
  const results = { created: 0, skipped: 0, errors: [] };

  try {
    // Find vendors with eligible orders
    const [vendors] = await db.query(`
      SELECT DISTINCT m.vendorId, m.id AS messId, u.name AS vendorName, u.phone, u.email
      FROM Orders o
      JOIN Messes m ON o.messId = m.id
      JOIN Users u ON m.vendorId = u.id
      WHERE o.status = 'delivered'
        AND o.isDeleted = 0
        AND o.id NOT IN (
          SELECT JSON_UNQUOTE(JSON_EXTRACT(orderIds, CONCAT('$[', idx, ']')))
          FROM Settlements s
          CROSS JOIN (SELECT 0 AS idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                      UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) AS indices
          WHERE s.status IN ('PENDING', 'PROCESSING', 'COMPLETED')
            AND JSON_UNQUOTE(JSON_EXTRACT(orderIds, CONCAT('$[', idx, ']'))) IS NOT NULL
        )
      GROUP BY m.vendorId, m.id, u.name, u.phone, u.email
    `);

    for (const vendor of vendors) {
      try {
        const config = await getSettlementConfig(vendor.vendorId);

        // Get eligible orders (delivered + past hold period)
        const [eligibleOrders] = await db.query(`
          SELECT id, totalAmount, createdAt
          FROM Orders
          WHERE messId = ?
            AND status = 'delivered'
            AND isDeleted = 0
            AND createdAt < NOW() - INTERVAL ? DAY
          ORDER BY createdAt ASC`,
          [vendor.messId, config.holdPeriodDays]
        );

        if (eligibleOrders.length === 0) {
          results.skipped++;
          continue;
        }

        // Calculate totals
        const totalAmount = roundToPaise(eligibleOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0));

        if (totalAmount < config.minSettlementAmount) {
          results.skipped++;
          continue;
        }

        const { commission, netAmount } = calculateCommission(totalAmount, {
          type: config.commissionType,
          amount: config.commissionAmount,
        });

        const orderIds = eligibleOrders.map(o => o.id);
        const periodFrom = eligibleOrders[0].createdAt;
        const periodTo = eligibleOrders[eligibleOrders.length - 1].createdAt;

        // Idempotency check
        const idempKey = `${vendor.vendorId}_${new Date(periodFrom).toISOString().split('T')[0]}_${new Date(periodTo).toISOString().split('T')[0]}`;
        const [existingSettlement] = await db.query(
          'SELECT id FROM Settlements WHERE vendorId = ? AND JSON_EXTRACT(settlementPeriod, "$.from") = ? AND status IN ("PENDING","PROCESSING","COMPLETED")',
          [vendor.vendorId, new Date(periodFrom).toISOString().split('T')[0]]
        );

        if (existingSettlement.length > 0) {
          results.skipped++;
          continue;
        }

        // Create settlement
        const settlementId = crypto.randomUUID();
        await db.query(`
          INSERT INTO Settlements (id, vendorId, messId, status, totalAmount, commissionAmount, netAmount, settlementPeriod, orderIds, initiatedBy)
          VALUES (?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?)`,
          [
            settlementId,
            vendor.vendorId,
            vendor.messId,
            totalAmount,
            commission,
            netAmount,
            JSON.stringify({ from: new Date(periodFrom).toISOString().split('T')[0], to: new Date(periodTo).toISOString().split('T')[0] }),
            JSON.stringify(orderIds),
            initiatedBy,
          ]
        );

        // Create ledger entries
        const connection = await db.getConnection();
        try {
          await connection.beginTransaction();

          const vendorAccountId = await ledgerService.getOrCreateAccount('VENDOR_WALLET', vendor.vendorId, 'USER', connection);

          const transactionId = await ledgerService.createTransaction({
            type: 'VENDOR_SETTLEMENT',
            amount: netAmount,
            referenceId: settlementId,
            referenceType: 'SETTLEMENT',
            idempotencyKey: `settlement_${settlementId}`,
            metadata: { vendorId: vendor.vendorId, orderCount: orderIds.length },
            status: 'PENDING',
          }, connection);

          // Debit Vendor Wallet → Credit external (bank payout)
          await ledgerService.createDoubleEntry({
            debitAccountId: vendorAccountId,
            creditAccountId: vendorAccountId, // Self-entry representing outgoing funds
            amount: netAmount,
            transactionId,
            narration: `Settlement payout to ${vendor.vendorName}`,
          }, connection);

          await connection.commit();
        } catch (e) {
          await connection.rollback();
          throw e;
        } finally {
          connection.release();
        }

        // Try to initiate payout
        try {
          const [bankDetails] = await db.query(
            'SELECT * FROM BankDetails WHERE vendorId = ? LIMIT 1',
            [vendor.vendorId]
          );

          if (bankDetails.length > 0) {
            const contactId = await payoutService.createContact({
              id: vendor.vendorId,
              name: vendor.vendorName,
              email: vendor.email,
              phone: vendor.phone,
            });

            const fundAccountId = await payoutService.createFundAccount(contactId, bankDetails[0]);

            const payout = await payoutService.initiatePayout({
              fundAccountId,
              amount: netAmount,
              settlementId,
              narration: `Digimess settlement #${settlementId.slice(0, 8)}`,
            });

            await db.query(
              "UPDATE Settlements SET status = 'PROCESSING', payoutId = ?, payoutStatus = ? WHERE id = ?",
              [payout.payoutId, payout.status, settlementId]
            );
          } else {
            await db.query(
              "UPDATE Settlements SET status = 'FAILED', failureReason = 'No bank details on file' WHERE id = ?",
              [settlementId]
            );
          }
        } catch (payoutError) {
          console.error(`[Settlement] Payout failed for vendor ${vendor.vendorId}:`, payoutError.message);
          await db.query(
            "UPDATE Settlements SET status = 'FAILED', failureReason = ? WHERE id = ?",
            [payoutError.message.substring(0, 500), settlementId]
          );
        }

        await logAudit(adminId, initiatedBy === 'ADMIN' ? 'ADMIN' : 'SYSTEM', 'settlement.created', 'SETTLEMENT', settlementId, {
          newState: { totalAmount, commission, netAmount, orderCount: orderIds.length },
        });

        results.created++;
      } catch (vendorError) {
        console.error(`[Settlement] Error for vendor ${vendor.vendorId}:`, vendorError.message);
        results.errors.push(`Vendor ${vendor.vendorId}: ${vendorError.message}`);
      }
    }
  } catch (error) {
    console.error('[Settlement] Trigger error:', error);
    results.errors.push(error.message);
  }

  return results;
}

/**
 * Retry a failed settlement.
 * @param {string} settlementId
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function retrySettlement(settlementId) {
  const [rows] = await db.query(
    "SELECT * FROM Settlements WHERE id = ? AND status = 'FAILED'",
    [settlementId]
  );

  if (rows.length === 0) {
    return { success: false, message: 'Settlement not found or not in FAILED status' };
  }

  const settlement = rows[0];

  if (settlement.retryCount >= settlement.maxRetries) {
    return { success: false, message: 'Max retries exceeded' };
  }

  try {
    // Get vendor bank details
    const [bankDetails] = await db.query('SELECT * FROM BankDetails WHERE vendorId = ? LIMIT 1', [settlement.vendorId]);
    if (bankDetails.length === 0) {
      return { success: false, message: 'No bank details on file' };
    }

    const [vendor] = await db.query('SELECT name, email, phone FROM Users WHERE id = ?', [settlement.vendorId]);

    const contactId = await payoutService.createContact({
      id: settlement.vendorId,
      name: vendor[0].name,
      email: vendor[0].email,
      phone: vendor[0].phone,
    });

    const fundAccountId = await payoutService.createFundAccount(contactId, bankDetails[0]);

    const payout = await payoutService.initiatePayout({
      fundAccountId,
      amount: parseFloat(settlement.netAmount),
      settlementId,
      narration: `Digimess settlement (retry) #${settlementId.slice(0, 8)}`,
    });

    await db.query(
      "UPDATE Settlements SET status = 'PROCESSING', payoutId = ?, payoutStatus = ?, retryCount = retryCount + 1, lastRetryAt = NOW() WHERE id = ?",
      [payout.payoutId, payout.status, settlementId]
    );

    return { success: true, message: 'Payout retried successfully' };
  } catch (error) {
    await db.query(
      "UPDATE Settlements SET retryCount = retryCount + 1, lastRetryAt = NOW(), failureReason = ? WHERE id = ?",
      [error.message.substring(0, 500), settlementId]
    );
    return { success: false, message: error.message };
  }
}

module.exports = {
  getSettlementConfig,
  triggerSettlements,
  retrySettlement,
};
