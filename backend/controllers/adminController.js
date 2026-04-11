const db = require('../config/db');

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin only.' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [[users]] = await db.query('SELECT COUNT(*) as count FROM Users WHERE isDeleted = 0');
    const [[messes]] = await db.query('SELECT COUNT(*) as count FROM Messes WHERE isDeleted = 0');
    const [[subs]] = await db.query('SELECT COUNT(*) as count FROM Subscriptions WHERE isActive = TRUE AND endDate >= CURDATE()');
    const [[revenue]] = await db.query("SELECT SUM(amount) as total FROM WalletTransactions WHERE type = 'credit'");
    
    res.json({
      totalUsers: users.count,
      totalMesses: messes.count,
      activeSubs: subs.count,
      totalRevenue: revenue.total ? parseFloat(revenue.total) : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving stats' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, phone, email, role, walletBalance, isActive, createdAt FROM Users WHERE isDeleted = 0 ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving users' });
  }
};

exports.getMesses = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, address, vendorId, isActive, rating, createdAt FROM Messes WHERE isDeleted = 0 ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving messes' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, u.name as customerName, u.phone as customerPhone, m.name as messName 
      FROM Orders o
      JOIN Users u ON o.userId = u.id
      JOIN Messes m ON o.messId = m.id
      ORDER BY o.createdAt DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving orders' });
  }
};

exports.updateUserWallet = async (req, res) => {
  const { userId, amount, type, description } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Update user balance
    const operator = type === 'credit' ? '+' : '-';
    await connection.query(`UPDATE Users SET walletBalance = walletBalance ${operator} ? WHERE id = ?`, [amount, userId]);
    
    // Record transaction
    const crypto = require('crypto');
    await connection.query('INSERT INTO WalletTransactions (id, userId, amount, type, description) VALUES (?, ?, ?, ?, ?)', [crypto.randomUUID(), userId, amount, type, description]);
    
    await connection.commit();
    res.json({ message: 'Wallet updated successfully' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error updating wallet' });
  } finally {
    connection.release();
  }
};

exports.getAppConfig = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM AppConfig');
    const config = rows.reduce((acc, row) => ({ ...acc, [row.configKey]: row.configValue }), {});
    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving config' });
  }
};

exports.updateAppConfig = async (req, res) => {
  const configs = req.body; // Expecting { key: value, ... }
  try {
    for (const [key, value] of Object.entries(configs)) {
      await db.query('INSERT INTO AppConfig (configKey, configValue) VALUES (?, ?) ON DUPLICATE KEY UPDATE configValue = ?', [key, value, value]);
    }
    res.json({ message: 'Configuration updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating config' });
  }
};

exports.getSubscriptions = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, u.name as customerName, u.phone as customerPhone, sp.name as planName 
      FROM Subscriptions s
      JOIN Users u ON s.userId = u.id
      JOIN SubscriptionPlans sp ON s.planId = sp.id
      ORDER BY s.startDate DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving subscriptions' });
  }
};


