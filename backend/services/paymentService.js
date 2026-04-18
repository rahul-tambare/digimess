/**
 * Payment Service — Razorpay SDK wrapper for Digimess.
 *
 * Handles:
 * - Creating Razorpay orders
 * - Verifying payment signatures (HMAC-SHA256)
 * - Processing successful payments with ledger entries
 */

const crypto = require('crypto');
const { getRazorpayInstance, getKeyId } = require('../utils/razorpayClient');
const { rupeesToPaise, paiseToRupees, roundToPaise, calculateCommission } = require('../utils/money');
const ledgerService = require('./ledgerService');
const { logAudit } = require('./auditService');
const db = require('../config/db');

/**
 * Create a Razorpay order for payment collection.
 * @param {number} amount - Amount in INR (rupees)
 * @param {string} receipt - Unique receipt/reference (e.g. orderId)
 * @param {object} [notes] - Razorpay order notes
 * @returns {Promise<{ razorpayOrderId: string, amount: number, currency: string, keyId: string }>}
 */
async function createRazorpayOrder(amount, receipt, notes = {}) {
  const razorpay = getRazorpayInstance();
  if (!razorpay) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  const amountInPaise = rupeesToPaise(amount);

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt,
    notes,
  });

  return {
    razorpayOrderId: order.id,
    amount: paiseToRupees(order.amount),
    currency: order.currency,
    keyId: getKeyId(),
  };
}

/**
 * Verify Razorpay payment signature.
 * HMAC-SHA256 of: razorpay_order_id + "|" + razorpay_payment_id
 * @param {string} razorpayOrderId
 * @param {string} razorpayPaymentId
 * @param {string} razorpaySignature
 * @returns {boolean}
 */
function verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error('RAZORPAY_KEY_SECRET not configured');

  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  return expectedSignature === razorpaySignature;
}

/**
 * Process a successful payment — create ledger entries.
 *
 * Flow for order payments:
 * 1. Money enters PLATFORM_ESCROW (from external/Razorpay)
 * 2. Vendor share goes from PLATFORM_ESCROW → VENDOR_WALLET
 * 3. Commission goes from PLATFORM_ESCROW → PLATFORM_REVENUE
 *
 * @param {object} params
 * @param {string} params.paymentSessionId
 * @param {string} params.razorpayPaymentId
 * @param {string} params.orderId - The Digimess order ID
 * @param {string} params.userId - Consumer ID
 * @param {number} params.amount - Payment amount in INR
 * @param {string} params.messId - The mess that receives the order
 * @param {object} connection - MySQL connection (must be in transaction)
 * @returns {Promise<string>} transactionId
 */
async function processOrderPayment(params, connection) {
  const { paymentSessionId, razorpayPaymentId, orderId, userId, amount, messId } = params;

  const roundedAmount = roundToPaise(amount);

  // 1. Get/create accounts
  const escrowAccountId = await ledgerService.getPlatformAccount('PLATFORM_ESCROW', connection);
  const revenueAccountId = await ledgerService.getPlatformAccount('PLATFORM_REVENUE', connection);

  // Get vendor from mess
  const [messRows] = await connection.query('SELECT vendorId FROM Messes WHERE id = ?', [messId]);
  if (messRows.length === 0) throw new Error('Mess not found');
  const vendorId = messRows[0].vendorId;

  const vendorAccountId = await ledgerService.getOrCreateAccount('VENDOR_WALLET', vendorId, 'USER', connection);

  // 2. Get commission config
  const [configRows] = await connection.query(
    'SELECT commissionType, commissionAmount FROM SettlementConfig WHERE vendorId = ? AND isActive = 1',
    [vendorId]
  );

  let chargeConfig;
  if (configRows.length > 0) {
    chargeConfig = { type: configRows[0].commissionType, amount: parseFloat(configRows[0].commissionAmount) };
  } else {
    // Fall back to global AdminCharges
    const [chargeRows] = await connection.query(
      "SELECT type, amount FROM AdminCharges WHERE appliesTo IN ('order', 'all') AND isActive = 1 LIMIT 1"
    );
    chargeConfig = chargeRows.length > 0
      ? { type: chargeRows[0].type, amount: parseFloat(chargeRows[0].amount) }
      : { type: 'percentage', amount: 0 };
  }

  const { commission, netAmount } = calculateCommission(roundedAmount, chargeConfig);

  // 3. Create ledger transaction
  const transactionId = await ledgerService.createTransaction({
    type: 'ORDER_PAYMENT',
    amount: roundedAmount,
    referenceId: orderId,
    referenceType: 'ORDER',
    gatewayTransactionId: razorpayPaymentId,
    idempotencyKey: `order_payment_${orderId}`,
    metadata: { paymentSessionId, commission, netAmount, chargeConfig },
  }, connection);

  // 4. Entry 1: External → Platform Escrow (full amount)
  await ledgerService.createDoubleEntry({
    debitAccountId: escrowAccountId, // Escrow receives (debit = asset increase)
    creditAccountId: escrowAccountId, // Self-credit representing incoming funds
    amount: roundedAmount,
    transactionId,
    narration: `Payment received for Order #${orderId.slice(0, 8)}`,
    metadata: { source: 'razorpay', paymentId: razorpayPaymentId },
    createdBy: userId,
  }, connection);

  // 5. Entry 2: Escrow → Vendor Wallet (net amount)
  if (netAmount > 0) {
    await ledgerService.createDoubleEntry({
      debitAccountId: escrowAccountId,
      creditAccountId: vendorAccountId,
      amount: netAmount,
      transactionId,
      narration: `Vendor share for Order #${orderId.slice(0, 8)}`,
      createdBy: userId,
    }, connection);
  }

  // 6. Entry 3: Escrow → Platform Revenue (commission)
  if (commission > 0) {
    await ledgerService.createDoubleEntry({
      debitAccountId: escrowAccountId,
      creditAccountId: revenueAccountId,
      amount: commission,
      transactionId,
      narration: `Commission for Order #${orderId.slice(0, 8)}`,
      metadata: { chargeConfig },
      createdBy: userId,
    }, connection);
  }

  return transactionId;
}

/**
 * Process a wallet payment for an order — create ledger entries.
 * Similar to processOrderPayment but from consumer wallet.
 */
async function processWalletOrderPayment(params, connection) {
  const { orderId, userId, amount, messId } = params;

  const roundedAmount = roundToPaise(amount);

  // Get accounts
  const consumerAccountId = await ledgerService.getOrCreateAccount('CONSUMER_WALLET', userId, 'USER', connection);
  const revenueAccountId = await ledgerService.getPlatformAccount('PLATFORM_REVENUE', connection);

  // Get vendor
  const [messRows] = await connection.query('SELECT vendorId FROM Messes WHERE id = ?', [messId]);
  if (messRows.length === 0) throw new Error('Mess not found');
  const vendorId = messRows[0].vendorId;
  const vendorAccountId = await ledgerService.getOrCreateAccount('VENDOR_WALLET', vendorId, 'USER', connection);

  // Commission
  const [configRows] = await connection.query(
    'SELECT commissionType, commissionAmount FROM SettlementConfig WHERE vendorId = ? AND isActive = 1',
    [vendorId]
  );

  let chargeConfig;
  if (configRows.length > 0) {
    chargeConfig = { type: configRows[0].commissionType, amount: parseFloat(configRows[0].commissionAmount) };
  } else {
    const [chargeRows] = await connection.query(
      "SELECT type, amount FROM AdminCharges WHERE appliesTo IN ('order', 'all') AND isActive = 1 LIMIT 1"
    );
    chargeConfig = chargeRows.length > 0
      ? { type: chargeRows[0].type, amount: parseFloat(chargeRows[0].amount) }
      : { type: 'percentage', amount: 0 };
  }

  const { commission, netAmount } = calculateCommission(roundedAmount, chargeConfig);

  // Create ledger transaction
  const transactionId = await ledgerService.createTransaction({
    type: 'ORDER_PAYMENT',
    amount: roundedAmount,
    referenceId: orderId,
    referenceType: 'ORDER',
    idempotencyKey: `wallet_order_${orderId}`,
    metadata: { paymentMethod: 'wallet', commission, netAmount },
  }, connection);

  // Entry 1: Consumer Wallet → Vendor Wallet (net amount)
  if (netAmount > 0) {
    await ledgerService.createDoubleEntry({
      debitAccountId: consumerAccountId,
      creditAccountId: vendorAccountId,
      amount: netAmount,
      transactionId,
      narration: `Wallet payment for Order #${orderId.slice(0, 8)}`,
      createdBy: userId,
    }, connection);
  }

  // Entry 2: Consumer Wallet → Platform Revenue (commission)
  if (commission > 0) {
    await ledgerService.createDoubleEntry({
      debitAccountId: consumerAccountId,
      creditAccountId: revenueAccountId,
      amount: commission,
      transactionId,
      narration: `Commission for Order #${orderId.slice(0, 8)}`,
      createdBy: userId,
    }, connection);
  }

  return transactionId;
}

/**
 * Process a wallet top-up — create ledger entries.
 * External funds → Consumer Wallet (via escrow for Razorpay, or direct for testing)
 */
async function processWalletTopup(params, connection) {
  const { userId, amount, gatewayTransactionId = null, idempotencyKey } = params;

  const roundedAmount = roundToPaise(amount);
  const consumerAccountId = await ledgerService.getOrCreateAccount('CONSUMER_WALLET', userId, 'USER', connection);
  const escrowAccountId = await ledgerService.getPlatformAccount('PLATFORM_ESCROW', connection);

  const transactionId = await ledgerService.createTransaction({
    type: 'WALLET_TOPUP',
    amount: roundedAmount,
    referenceId: userId,
    referenceType: 'WALLET_TOPUP',
    gatewayTransactionId,
    idempotencyKey: idempotencyKey || `wallet_topup_${userId}_${Date.now()}`,
    metadata: { userId },
  }, connection);

  // Escrow → Consumer Wallet
  await ledgerService.createDoubleEntry({
    debitAccountId: escrowAccountId,
    creditAccountId: consumerAccountId,
    amount: roundedAmount,
    transactionId,
    narration: `Wallet top-up of ₹${roundedAmount}`,
    createdBy: userId,
  }, connection);

  return transactionId;
}

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  processOrderPayment,
  processWalletOrderPayment,
  processWalletTopup,
};
