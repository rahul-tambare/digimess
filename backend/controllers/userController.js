const db = require('../config/db');

// GET /api/user/profile
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, phone, name, email, gender, dateOfBirth, role, walletBalance FROM Users WHERE id = ?', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];

    const [subRows] = await db.query('SELECT id FROM Subscriptions WHERE customerId = ? AND isActive = TRUE AND endDate >= CURDATE() LIMIT 1', [req.user.id]);
    user.hasActiveSubscription = subRows.length > 0;

    res.json(user);
  } catch (e) {
    console.error('API Error in getProfile:', e);
    res.status(500).json({ error: 'Internal server error', details: e.message });
  }
};

// PUT /api/user/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, gender, dateOfBirth, phone } = req.body;

    // validate or set to null to avoid mysql crash
    let validDob = dateOfBirth;
    if (validDob && !/^\d{4}-\d{2}-\d{2}$/.test(validDob)) {
      validDob = null;
    }

    await db.query(
      'UPDATE Users SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), gender = COALESCE(?, gender), dateOfBirth = COALESCE(?, dateOfBirth) WHERE id = ?',
      [name, email, phone, gender, validDob, req.user.id]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (e) {
    console.error('API Error in updateProfile:', e);
    res.status(500).json({ error: 'Internal server error', details: e.message });
  }
};
