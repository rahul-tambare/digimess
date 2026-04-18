/**
 * Refund Service — Refund orchestration for Digimess.
 *
 * Supports:
 * - Full and partial refunds
 * - Refund to original payment method (Razorpay) or wallet
 * - Commission reversal (proportional for partial)
 * - Over-refund prevention
 * - Post-settlement refund recovery tracking
 */

const db = require('../config/db');
const crypto = require('crypto');
const ledgerService = require('./ledgerService');
const { logAudit } = require('./auditService');
const { roundToPaise, calculateCommission, safeSubtract } = require('../utils/money');
const { getRazorpayInstance } = require('../utils/razorpayClient');

/**
 * Initiate a refund for an order.
 * @param {object} params
 * @param {string} params.orderId
 * @param {number} params.amount - Refund amount (full order amount for full refund)
 * @param {string} params.reason
 * @param {'ORIGINAL_PAYMENT'|'WALLET'} [params.refundMethod='WALLET']
 * @param {string} params.initiatedBy - Admin user ID
 * @param {object} [params.req] - Express request for audit
 * @returns {Promise<{ refundId: string, status: string, amount: number }>}
 */
async function initiateRefund(params) {
  const { orderId, amount, reason, refundMethod = 'WALLET', initiatedBy, req } = params;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get order details
    const [orderRows] = await connection.query(
      'SELECT o.*, m.vendorId FROM Orders o JOIN Messes m ON o.messId = m.id WHERE o.id = ? FOR UPDATE',
      [orderId]
    );
    if (orderRows.length === 0) throw new Error('Order not found');
    const order = orderRows[0];

    const refundAmount = roundToPaise(amount);
    const orderAmount = parseFloat(order.totalAmount);

    // 2. Validate: prevent over-refund
    const [existingRefunds] = await connection.query(
      "SELECT COALESCE(SUM(amount), 0) as totalRefunded FROM Refunds WHERE orderId = ? AND status IN ('COMPLETED', 'PROCESSING', 'PENDING')",
      [orderId]
    );
    const alreadyRefunded = parseFloat(existingRefunds[0].totalRefunded);

    if (alreadyRefunded + refundAmount > orderAmount) {
      await connection.rollback();
      throw new Error(`Over-refund: already refunded ₹${alreadyRefunded}, order total ₹${orderAmount}. Max refundable: ₹${safeSubtract(orderAmount, alreadyRefunded)}`);
    }

    const isFullRefund = Math.abs(refundAmount - orderAmount) < 0.01;
    const refundType = isFullRefund ? 'FULL' : 'PARTIAL';

    // 3. Create refund record
    const refundId = crypto.randomUUID();

    // 4. Get commission config for proportional commission reversal
    const [configRows] = await connection.query(
      'SELECT commissionType, commissionAmount FROM SettlementConfig WHERE vendorId = ? AND isActive = 1',
      [order.vendorId]
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

    const { commission: refundCommission } = calculateCommission(refundAmount, chargeConfig);
    const vendorRefund = safeSubtract(refundAmount, refundCommission);

    // 5. Create ledger transaction
    const transactionId = await ledgerService.createTransaction({
      type: 'REFUND',
      amount: refundAmount,
      referenceId: orderId,
      referenceType: 'ORDER_REFUND',
      idempotencyKey: `refund_${orderId}_${refundId}`,
      metadata: { refundId, refundType, refundCommission, vendorRefund, reason },
    }, connection);

    // 6. Ledger entries — reverse the original flow
    const consumerAccountId = await ledgerService.getOrCreateAccount('CONSUMER_WALLET', order.customerId, 'USER', connection);
    const vendorAccountId = await ledgerService.getOrCreateAccount('VENDOR_WALLET', order.vendorId, 'USER', connection);
    const revenueAccountId = await ledgerService.getPlatformAccount('PLATFORM_REVENUE', connection);

    // Vendor → Consumer (vendor's share returned)
    if (vendorRefund > 0) {
      await ledgerService.createDoubleEntry({
        debitAccountId: vendorAccountId,
        creditAccountId: consumerAccountId,
        amount: vendorRefund,
        transactionId,
        narration: `Refund for Order #${orderId.slice(0, 8)} (vendor share)`,
        createdBy: initiatedBy,
      }, connection);
    }

    // Platform Revenue → Consumer (commission reversed)
    if (refundCommission > 0) {
      await ledgerService.createDoubleEntry({
        debitAccountId: revenueAccountId,
        creditAccountId: consumerAccountId,
        amount: refundCommission,
        transactionId,
        narration: `Commission reversal for Order #${orderId.slice(0, 8)}`,
        createdBy: initiatedBy,
      }, connection);
    }

    // 7. If refund to wallet, credit wallet balance (backward compat)
    if (refundMethod === 'WALLET') {
      await connection.query(
        'UPDATE Users SET walletBalance = walletBalance + ? WHERE id = ?',
        [refundAmount, order.customerId]
      );

      const walletTxnId = crypto.randomUUID();
      await connection.query(
        'INSERT INTO WalletTransactions (id, userId, amount, type, description) VALUES (?, ?, ?, ?, ?)',
        [walletTxnId, order.customerId, refundAmount, 'credit', `Refund for Order #${orderId.slice(0, 8)} — ${reason || 'Admin initiated'}`]
      );
    }

    // 8. If refund to original payment (Razorpay), initiate gateway refund
    let gatewayRefundId = null;
    if (refundMethod === 'ORIGINAL_PAYMENT') {
      const [sessionRows] = await connection.query(
        "SELECT gatewayPaymentId FROM PaymentSessions WHERE referenceId = ? AND status = 'success' AND gatewayPaymentId IS NOT NULL LIMIT 1",
        [orderId]
      );

      if (sessionRows.length > 0 && sessionRows[0].gatewayPaymentId) {
        const razorpay = getRazorpayInstance();
        if (razorpay) {
          try {
            const refundResult = await razorpay.payments.refund(sessionRows[0].gatewayPaymentId, {
              amount: Math.round(refundAmount * 100), // paise
              notes: { orderId, refundId, reason },
            });
            gatewayRefundId = refundResult.id;
          } catch (e) {
            console.error('[Refund] Razorpay refund failed, falling back to wallet:', e.message);
            // Fall back to wallet refund
            await connection.query(
              'UPDATE Users SET walletBalance = walletBalance + ? WHERE id = ?',
              [refundAmount, order.customerId]
            );
            const walletTxnId = crypto.randomUUID();
            await connection.query(
              'INSERT INTO WalletTransactions (id, userId, amount, type, description) VALUES (?, ?, ?, ?, ?)',
              [walletTxnId, order.customerId, refundAmount, 'credit', `Refund for Order #${orderId.slice(0, 8)} (gateway failed, credited to wallet)`]
            );
          }
        }
      }
    }

    // 9. Insert refund record
    await connection.query(`
      INSERT INTO Refunds (id, orderId, transactionId, type, amount, reason, status, refundMethod, gatewayRefundId, initiatedBy, processedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [refundId, orderId, transactionId, refundType, refundAmount, reason, gatewayRefundId ? 'PROCESSING' : 'COMPLETED', refundMethod, gatewayRefundId, initiatedBy]
    );

    // 10. Update order status
    if (isFullRefund) {
      await connection.query("UPDATE Orders SET status = 'cancelled' WHERE id = ?", [orderId]);
    }

    await connection.commit();

    await logAudit(initiatedBy, 'ADMIN', 'refund.initiated', 'REFUND', refundId, {
      newState: { orderId, amount: refundAmount, refundType, refundMethod },
      req,
    });

    return { refundId, status: gatewayRefundId ? 'PROCESSING' : 'COMPLETED', amount: refundAmount };
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}

module.exports = { initiateRefund };
