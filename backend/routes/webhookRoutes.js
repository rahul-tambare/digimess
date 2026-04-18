/**
 * Webhook Routes — Razorpay and RazorpayX webhooks.
 *
 * These routes are UNAUTHENTICATED (no JWT) — they use signature verification instead.
 * MUST be registered with express.raw() middleware for proper signature validation.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');
const { verifyRazorpayWebhook } = require('../middlewares/webhookVerifier');
const paymentService = require('../services/paymentService');
const { logAudit } = require('../services/auditService');

/**
 * POST /api/webhooks/razorpay
 * Handles Razorpay payment and refund events.
 */
router.post('/razorpay', verifyRazorpayWebhook, async (req, res) => {
  // Respond 200 immediately — process async
  res.status(200).json({ status: 'ok' });

  try {
    const event = req.body;
    const eventId = event.event;
    const payload = event.payload;

    // Log raw webhook
    await logAudit(null, 'WEBHOOK', `webhook.${eventId}`, 'WEBHOOK', event.event, {
      metadata: { eventId, accountId: event.account_id },
    });

    // Idempotency: check if this event was already processed
    const idempotencyKey = `webhook_${event.event}_${payload?.payment?.entity?.id || payload?.refund?.entity?.id || event.event}`;

    const [existing] = await db.query(
      'SELECT id FROM LedgerTransactions WHERE idempotencyKey = ?',
      [idempotencyKey]
    );
    if (existing.length > 0) {
      console.log(`[Webhook] Already processed: ${idempotencyKey}`);
      return;
    }

    switch (eventId) {
      case 'payment.captured': {
        const payment = payload.payment.entity;
        const razorpayOrderId = payment.order_id;

        // Find the payment session
        const [sessions] = await db.query(
          "SELECT * FROM PaymentSessions WHERE gatewayOrderId = ? AND status = 'pending'",
          [razorpayOrderId]
        );

        if (sessions.length > 0) {
          const session = sessions[0];
          const connection = await db.getConnection();
          try {
            await connection.beginTransaction();

            // Update session status
            await connection.query(
              "UPDATE PaymentSessions SET status = 'success', gatewayPaymentId = ?, completedAt = NOW() WHERE id = ?",
              [payment.id, session.id]
            );

            // Process payment based on type
            if (session.type === 'recharge') {
              const amount = parseFloat(session.amount);
              await connection.query(
                'UPDATE Users SET walletBalance = walletBalance + ? WHERE id = ?',
                [amount, session.userId]
              );
              const txnId = crypto.randomUUID();
              await connection.query(
                'INSERT INTO WalletTransactions (id, userId, amount, type, description) VALUES (?, ?, ?, ?, ?)',
                [txnId, session.userId, amount, 'credit', 'Wallet Top-Up via Razorpay (webhook)']
              );
              await paymentService.processWalletTopup({
                userId: session.userId,
                amount,
                gatewayTransactionId: payment.id,
                idempotencyKey,
              }, connection);
            } else if (session.type === 'order' && session.referenceId) {
              const [orderRows] = await connection.query('SELECT messId FROM Orders WHERE id = ?', [session.referenceId]);
              if (orderRows.length > 0) {
                await paymentService.processOrderPayment({
                  paymentSessionId: session.id,
                  razorpayPaymentId: payment.id,
                  orderId: session.referenceId,
                  userId: session.userId,
                  amount: parseFloat(session.amount),
                  messId: orderRows[0].messId,
                }, connection);
                await connection.query("UPDATE Orders SET paymentMethod = 'razorpay' WHERE id = ?", [session.referenceId]);
              }
            }

            await connection.commit();
          } catch (e) {
            await connection.rollback();
            console.error('[Webhook] payment.captured processing error:', e);
          } finally {
            connection.release();
          }
        }
        break;
      }

      case 'payment.failed': {
        const payment = payload.payment.entity;
        await db.query(
          "UPDATE PaymentSessions SET status = 'failed', completedAt = NOW() WHERE gatewayOrderId = ?",
          [payment.order_id]
        );
        break;
      }

      case 'refund.processed': {
        const refund = payload.refund.entity;
        // Update refund status in Refunds table
        await db.query(
          "UPDATE Refunds SET status = 'COMPLETED', gatewayRefundId = ?, processedAt = NOW() WHERE gatewayRefundId = ?",
          [refund.id, refund.id]
        );
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${eventId}`);
    }
  } catch (error) {
    console.error('[Webhook] Processing error:', error);
  }
});

/**
 * POST /api/webhooks/razorpayx
 * Handles RazorpayX payout status events.
 */
router.post('/razorpayx', verifyRazorpayWebhook, async (req, res) => {
  res.status(200).json({ status: 'ok' });

  try {
    const event = req.body;
    const eventId = event.event;
    const payload = event.payload;

    await logAudit(null, 'WEBHOOK', `webhook.${eventId}`, 'WEBHOOK', event.event, {
      metadata: { eventId },
    });

    switch (eventId) {
      case 'payout.processed': {
        const payout = payload.payout.entity;
        await db.query(
          "UPDATE Settlements SET status = 'COMPLETED', payoutStatus = 'processed', settledAt = NOW() WHERE payoutId = ?",
          [payout.id]
        );
        break;
      }

      case 'payout.failed':
      case 'payout.reversed': {
        const payout = payload.payout.entity;
        await db.query(
          "UPDATE Settlements SET status = 'FAILED', payoutStatus = ?, failureReason = ? WHERE payoutId = ?",
          [eventId.replace('payout.', ''), payout.failure_reason || 'Unknown', payout.id]
        );
        break;
      }

      default:
        console.log(`[WebhookX] Unhandled event: ${eventId}`);
    }
  } catch (error) {
    console.error('[WebhookX] Processing error:', error);
  }
});

module.exports = router;
