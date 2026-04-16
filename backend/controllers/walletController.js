const db = require('../config/db');

// GET /api/wallet/balance
exports.getBalance = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT walletBalance FROM Users WHERE id = ?', [req.user.id]);
    res.json({ balance: rows[0]?.walletBalance || 0 });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/wallet/topup — credit wallet
exports.topUp = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });
    await conn.beginTransaction();
    await conn.query('UPDATE Users SET walletBalance = walletBalance + ? WHERE id = ?', [amount, req.user.id]);
    const txnId = require('crypto').randomUUID();
    await conn.query(
      'INSERT INTO WalletTransactions (id, userId, amount, type, description) VALUES (?, ?, ?, ?, ?)',
      [txnId, req.user.id, amount, 'credit', 'Wallet Top-Up']
    );
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
