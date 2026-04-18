const db = require('../config/db');
const crypto = require('crypto');
const paymentService = require('../services/paymentService');
const { logAudit } = require('../services/auditService');
const { roundToPaise } = require('../utils/money');

// GET /api/wallet/balance
exports.getBalance = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT walletBalance FROM Users WHERE id = ?', [req.user.id]);
    res.json({ balance: rows[0]?.walletBalance || 0 });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/wallet/topup — credit wallet (legacy — direct balance update)
exports.topUp = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });
    await conn.beginTransaction();
    await conn.query('UPDATE Users SET walletBalance = walletBalance + ? WHERE id = ?', [amount, req.user.id]);
    const txnId = crypto.randomUUID();
    await conn.query(
      'INSERT INTO WalletTransactions (id, userId, amount, type, description) VALUES (?, ?, ?, ?, ?)',
      [txnId, req.user.id, amount, 'credit', 'Wallet Top-Up']
    );

    // Best-effort ledger entry
    try {
      await paymentService.processWalletTopup({
        userId: req.user.id,
        amount,
        idempotencyKey: `direct_topup_${txnId}`,
      }, conn);
    } catch (ledgerErr) {
      console.error('Ledger entry for direct topup failed (non-critical):', ledgerErr.message);
    }

    await conn.commit();
    res.json({ message: 'Wallet topped up successfully' });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
};

// POST /api/wallet/topup/razorpay — create Razorpay order for wallet recharge
exports.createTopupOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

    const roundedAmount = roundToPaise(amount);
    const sessionId = crypto.randomUUID();

    const razorpayOrder = await paymentService.createRazorpayOrder(
      roundedAmount,
      sessionId,
      { userId: req.user.id, type: 'recharge' }
    );

    await db.query(
      `INSERT INTO PaymentSessions (id, userId, amount, type, status, gatewayOrderId, referenceType)
       VALUES (?, ?, ?, 'recharge', 'pending', ?, 'WALLET_TOPUP')`,
      [sessionId, req.user.id, roundedAmount, razorpayOrder.razorpayOrderId]
    );

    await logAudit(req.user.id, 'USER', 'wallet.topup_order_created', 'PAYMENT_SESSION', sessionId, {
      newState: { amount: roundedAmount, razorpayOrderId: razorpayOrder.razorpayOrderId },
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
    console.error('Create topup order error:', e);
    if (e.message.includes('not configured')) {
      return res.status(503).json({ error: 'Payment gateway is not configured.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/wallet/transactions
exports.getTransactions = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM WalletTransactions WHERE userId = ? ORDER BY createdAt DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
