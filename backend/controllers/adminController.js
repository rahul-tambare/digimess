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
    const [[users]] = await db.query('SELECT COUNT(*) as count FROM Users');
    const [[messes]] = await db.query('SELECT COUNT(*) as count FROM Messes');
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
    const [rows] = await db.query('SELECT id, name, phone, email, role, walletBalance, createdAt FROM Users ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving users' });
  }
};

exports.getMesses = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, address, vendorId, createdAt FROM Messes ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving messes' });
  }
};
