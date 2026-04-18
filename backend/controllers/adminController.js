const db = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    const [[users]] = await db.query('SELECT COUNT(*) as count FROM Users WHERE isDeleted = 0');
    const [[messes]] = await db.query('SELECT COUNT(*) as count FROM Messes WHERE isDeleted = 0');
    const [[subs]] = await db.query('SELECT COUNT(*) as count FROM Subscriptions WHERE isActive = TRUE AND endDate >= CURDATE()');
    const [[orders]] = await db.query('SELECT COUNT(*) as count FROM Orders');
    const [[revenue]] = await db.query("SELECT SUM(amount) as total FROM WalletTransactions WHERE type = 'credit'");
    
    // Fetch 5 latest orders
    const [recentOrders] = await db.query(`
      SELECT o.*, u.name as customerName, m.name as messName 
      FROM Orders o
      JOIN Users u ON o.customerId = u.id
      JOIN Messes m ON o.messId = m.id
      ORDER BY o.createdAt DESC
      LIMIT 5
    `);

    // Fetch top 5 approved messes by rating
    const [topMesses] = await db.query(`
      SELECT id, name, rating as avgRating 
      FROM Messes 
      WHERE isApproved = 1 AND isDeleted = 0
      ORDER BY rating DESC 
      LIMIT 5
    `);

    res.json({
      totalUsers: users.count,
      totalMesses: messes.count,
      activeSubs: subs.count,
      totalOrders: orders.count,
      totalRevenue: revenue.total ? parseFloat(revenue.total) : 0,
      recentOrders,
      topMesses
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving stats' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM Users WHERE isDeleted = 0');
    const [rows] = await db.query(
      'SELECT id, name, phone, email, role, walletBalance, isActive, createdAt FROM Users WHERE isDeleted = 0 ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json({
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving users' });
  }
};

exports.getMesses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM Messes WHERE isDeleted = 0');
    const [rows] = await db.query(
      'SELECT id, name, address, vendorId, isActive, rating, createdAt FROM Messes WHERE isDeleted = 0 ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json({
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving messes' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM Orders');
    const [rows] = await db.query(`
      SELECT o.*, u.name as customerName, u.phone as customerPhone, m.name as messName 
      FROM Orders o
      JOIN Users u ON o.customerId = u.id
      JOIN Messes m ON o.messId = m.id
      ORDER BY o.createdAt DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    res.json({
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM Subscriptions');
    const [rows] = await db.query(`
      SELECT s.*, u.name as customerName, u.phone as customerPhone, sp.name as planName 
      FROM Subscriptions s
      JOIN Users u ON s.customerId = u.id
      LEFT JOIN SubscriptionPlans sp ON s.planId = sp.id
      ORDER BY s.startDate DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    res.json({
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving subscriptions' });
  }
};

exports.approveMess = async (req, res) => {
  const { id } = req.params;
  const { isApproved } = req.body;
  try {
    await db.query('UPDATE Messes SET isApproved = ? WHERE id = ?', [isApproved ? 1 : 0, id]);
    res.json({ message: `Mess ${isApproved ? 'approved' : 'unapproved'} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating mess approval' });
  }
};

exports.toggleMessStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  try {
    await db.query('UPDATE Messes SET isActive = ? WHERE id = ?', [isActive ? 1 : 0, id]);
    res.json({ message: `Mess ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error toggling mess status' });
  }
};

exports.getRevenue = async (req, res) => {
  try {
    // Total revenue
    const [[totalRow]] = await db.query("SELECT COALESCE(SUM(amount), 0) as total FROM WalletTransactions WHERE type = 'credit'");
    
    // This month revenue
    const [[monthRow]] = await db.query("SELECT COALESCE(SUM(amount), 0) as total FROM WalletTransactions WHERE type = 'credit' AND MONTH(createdAt) = MONTH(CURDATE()) AND YEAR(createdAt) = YEAR(CURDATE())");

    // Monthly trend (last 7 months)
    const [monthlyTrend] = await db.query(`
      SELECT DATE_FORMAT(createdAt, '%b') as label, COALESCE(SUM(amount), 0) as value
      FROM WalletTransactions WHERE type = 'credit'
      GROUP BY YEAR(createdAt), MONTH(createdAt), DATE_FORMAT(createdAt, '%b')
      ORDER BY YEAR(createdAt) DESC, MONTH(createdAt) DESC
      LIMIT 7
    `);

    // Revenue breakdown by description categories
    const [breakdown] = await db.query(`
      SELECT 
        CASE
          WHEN description LIKE '%order%' OR description LIKE '%Order%' THEN 'Order Payments'
          WHEN description LIKE '%subscription%' OR description LIKE '%Subscription%' THEN 'Subscription Plans'
          WHEN description LIKE '%recharge%' OR description LIKE '%Recharge%' OR description LIKE '%top%' THEN 'Wallet Recharges'
          WHEN description LIKE '%delivery%' OR description LIKE '%Delivery%' THEN 'Delivery Charges'
          ELSE 'Other'
        END as category,
        COALESCE(SUM(amount), 0) as total
      FROM WalletTransactions WHERE type = 'credit'
      GROUP BY category
    `);

    // Recent transactions with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [[{ count: transCount }]] = await db.query("SELECT COUNT(*) as count FROM WalletTransactions");

    const [transactions] = await db.query(`
      SELECT wt.id, wt.amount, wt.type, wt.description, wt.createdAt as date, u.name as user
      FROM WalletTransactions wt
      JOIN Users u ON wt.userId = u.id
      ORDER BY wt.createdAt DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    res.json({
      totalRevenue: parseFloat(totalRow.total),
      monthRevenue: parseFloat(monthRow.total),
      monthlyTrend: monthlyTrend.reverse(),
      breakdown,
      transactions: {
        data: transactions,
        pagination: {
          total: transCount,
          page,
          limit,
          totalPages: Math.ceil(transCount / limit)
        }
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving revenue data' });
  }
};
