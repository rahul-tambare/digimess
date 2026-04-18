/**
 * Payment Controller — Razorpay order creation and verification for Digimess.
 */

const db = require('../config/db');
const crypto = require('crypto');
const paymentService = require('../services/paymentService');
const { logAudit } = require('../services/auditService');
const { roundToPaise } = require('../utils/money');

/**
 * POST /api/payments/create-order
 * Create a Razorpay order for checkout (order or wallet topup).
 */
exports.createOrder = async (req, res) => {
  try {
    const { amount, type, referenceId, notes } = req.body;
    // type: 'order' or 'recharge'
    // referenceId: orderId (for order payments) or null (for wallet topup)

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!type || !['order', 'recharge'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "order" or "recharge"' });
    }

    const roundedAmount = roundToPaise(amount);

    // Create PaymentSession
    const sessionId = crypto.randomUUID();

    // Create Razorpay order
    const razorpayOrder = await paymentService.createRazorpayOrder(
      roundedAmount,
      sessionId,
      { userId: req.user.id, type, referenceId: referenceId || '', ...notes }
    );

    // Save payment session
    await db.query(
      `INSERT INTO PaymentSessions (id, userId, amount, type, status, gatewayOrderId, referenceId, referenceType)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [sessionId, req.user.id, roundedAmount, type, razorpayOrder.razorpayOrderId, referenceId || null, type === 'order' ? 'ORDER' : 'WALLET_TOPUP']
    );

    await logAudit(req.user.id, 'USER', 'payment.created', 'PAYMENT_SESSION', sessionId, {
      newState: { amount: roundedAmount, type, razorpayOrderId: razorpayOrder.razorpayOrderId },
      req,
    });

    res.status(201).json({
      sessionId,
      razorpayOrderId: razorpayOrder.razorpayOrderId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: razorpayOrder.keyId,
    });
  } catch (e) {
    console.error('Payment create-order error:', e);
    if (e.message.includes('not configured')) {
      return res.status(503).json({ error: 'Payment gateway is not configured.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/payments/verify
 * Verify Razorpay payment signature and complete the payment.
 */
exports.verifyPayment = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, sessionId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification parameters' });
    }

    // 1. Verify signature
    const isValid = paymentService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      await logAudit(req.user.id, 'USER', 'payment.verification_failed', 'PAYMENT_SESSION', sessionId, {
        metadata: { razorpay_order_id, razorpay_payment_id },
        req,
      });
      return res.status(400).json({ error: 'Payment verification failed — invalid signature' });
    }

    await connection.beginTransaction();

    // 2. Find and validate payment session
    const [sessions] = await connection.query(
      'SELECT * FROM PaymentSessions WHERE id = ? AND userId = ? AND status = ? FOR UPDATE',
      [sessionId, req.user.id, 'pending']
    );

    if (sessions.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Payment session not found or already processed' });
    }

    const session = sessions[0];

    // 3. Update session
    await connection.query(
      `UPDATE PaymentSessions SET status = 'success', gatewayPaymentId = ?, gatewaySignature = ?, completedAt = NOW()
       WHERE id = ?`,
      [razorpay_payment_id, razorpay_signature, sessionId]
    );

    // 4. Process based on type
    if (session.type === 'recharge') {
      // Wallet top-up
      const amount = parseFloat(session.amount);

      // Update Users.walletBalance (backward compatibility)
      await connection.query(
        'UPDATE Users SET walletBalance = walletBalance + ? WHERE id = ?',
        [amount, req.user.id]
      );

      // WalletTransactions (backward compatibility)
      const txnId = crypto.randomUUID();
      await connection.query(
        'INSERT INTO WalletTransactions (id, userId, amount, type, description) VALUES (?, ?, ?, ?, ?)',
        [txnId, req.user.id, amount, 'credit', 'Wallet Top-Up via Razorpay']
      );

      // Ledger entries
      await paymentService.processWalletTopup({
        userId: req.user.id,
        amount,
        gatewayTransactionId: razorpay_payment_id,
        idempotencyKey: `topup_${sessionId}`,
      }, connection);

    } else if (session.type === 'order' && session.referenceId) {
      // Order payment
      const orderId = session.referenceId;
      const amount = parseFloat(session.amount);

      // Get the order details
      const [orderRows] = await connection.query(
        'SELECT messId FROM Orders WHERE id = ?',
        [orderId]
      );

      if (orderRows.length > 0) {
        await paymentService.processOrderPayment({
          paymentSessionId: sessionId,
          razorpayPaymentId: razorpay_payment_id,
          orderId,
          userId: req.user.id,
          amount,
          messId: orderRows[0].messId,
        }, connection);

        // Update order payment method
        await connection.query(
          "UPDATE Orders SET paymentMethod = 'razorpay' WHERE id = ?",
          [orderId]
        );
      }
    }

    await connection.commit();

    await logAudit(req.user.id, 'USER', 'payment.verified', 'PAYMENT_SESSION', sessionId, {
      newState: { status: 'success', razorpay_payment_id },
      req,
    });

    res.json({ message: 'Payment verified successfully', sessionId });
  } catch (e) {
    await connection.rollback();
    console.error('Payment verify error:', e);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

/**
 * GET /api/payments/:id
 * Get payment session details.
 */
exports.getPaymentSession = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM PaymentSessions WHERE id = ? AND userId = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Payment session not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Get payment session error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
