const db = require('../config/db');

// POST /api/user/subscriptions
exports.subscribe = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { planId, amount, messId } = req.body;
    
    await connection.beginTransaction();

    // 1. Check Wallet Balance
    const [userRows] = await connection.query('SELECT walletBalance FROM Users WHERE id = ? FOR UPDATE', [req.user.id]);
    const balance = parseFloat(userRows[0].walletBalance);
    const planAmount = parseFloat(amount);

    if (balance < planAmount) {
      await connection.rollback();
      return res.status(400).json({ error: 'Insufficient wallet balance', shortfall: planAmount - balance });
    }

    // 2. Deduct Wallet
    await connection.query('UPDATE Users SET walletBalance = walletBalance - ? WHERE id = ?', [planAmount, req.user.id]);

    // 3. Log Wallet Transaction
    const txId = require('crypto').randomUUID();
    await connection.query(
      'INSERT INTO WalletTransactions (id, userId, amount, type, description) VALUES (?, ?, ?, ?, ?)',
      [txId, req.user.id, planAmount, 'debit', 'Subscription purchased']
    );

    // 4. Create Subscription Entry
    const subId = require('crypto').randomUUID();
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); // 1 month default

    const { allowedMesses } = req.body;

    await connection.query(
      'INSERT INTO Subscriptions (id, customerId, messId, type, startDate, endDate, mealsRemaining, allowedMesses) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        subId, 
        req.user.id, 
        messId || null, 
        allowedMesses ? 'multi_mess' : 'single_mess', 
        startDate, 
        endDate, 
        req.body.mealsCount || 30,
        allowedMesses ? JSON.stringify(allowedMesses) : null
      ]
    );

    await connection.commit();
    res.status(201).json({ message: 'Subscription successful', subscriptionId: subId });
  } catch (e) {
    await connection.rollback();
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// GET /api/user/subscriptions
exports.getMySubscriptions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, m.name AS messName, m.images AS messImages
       FROM Subscriptions s
       LEFT JOIN Messes m ON s.messId = m.id
       WHERE s.customerId = ?
       ORDER BY s.createdAt DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
