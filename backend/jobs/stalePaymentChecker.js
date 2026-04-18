/**
 * Stale Payment Checker — Expire unpaid Razorpay orders after 30 minutes.
 *
 * Usage: node jobs/stalePaymentChecker.js
 */

const db = require('../config/db');

async function checkStalePayments() {
  console.log(`[StalePaymentChecker] Starting at ${new Date().toISOString()}`);

  try {
    // Find pending payment sessions older than 30 minutes
    const [stalePayments] = await db.query(
      `SELECT ps.id, ps.referenceId, ps.type, ps.amount
       FROM PaymentSessions ps
       WHERE ps.status = 'pending'
         AND ps.createdAt < NOW() - INTERVAL 30 MINUTE`
    );

    console.log(`[StalePaymentChecker] Found ${stalePayments.length} stale payments`);

    for (const payment of stalePayments) {
      // Mark payment as failed
      await db.query(
        "UPDATE PaymentSessions SET status = 'failed', completedAt = NOW() WHERE id = ?",
        [payment.id]
      );

      // If it was an order payment, mark order as cancelled
      if (payment.type === 'order' && payment.referenceId) {
        await db.query(
          "UPDATE Orders SET status = 'cancelled' WHERE id = ? AND status = 'pending'",
          [payment.referenceId]
        );
        console.log(`[StalePaymentChecker] Cancelled order ${payment.referenceId} (payment expired)`);
      }
    }

    console.log('[StalePaymentChecker] Complete');
  } catch (error) {
    console.error('[StalePaymentChecker] Fatal error:', error);
  }

  process.exit(0);
}

if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
  checkStalePayments();
}

module.exports = { checkStalePayments };
