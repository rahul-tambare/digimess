const db = require('../config/db');

// GET /api/user/profile
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, phone, name, email, role, walletBalance FROM Users WHERE id = ?', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];

    const [subRows] = await db.query('SELECT id FROM Subscriptions WHERE customerId = ? AND isActive = TRUE AND endDate >= CURDATE() LIMIT 1', [req.user.id]);
    user.hasActiveSubscription = subRows.length > 0;

    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/user/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    await db.query('UPDATE Users SET name = ?, email = ? WHERE id = ?', [name, email, req.user.id]);
    res.json({ message: 'Profile updated successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
