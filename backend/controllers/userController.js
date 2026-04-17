const db = require('../config/db');

// GET /api/user/profile
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, phone, name, email, gender, dateOfBirth, role, walletBalance,
              dietaryPreference, locationLat, locationLng, locationArea
       FROM Users WHERE id = ?`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];

    const [subRows] = await db.query(
      'SELECT id FROM Subscriptions WHERE customerId = ? AND isActive = TRUE AND endDate >= CURDATE() LIMIT 1',
      [req.user.id]
    );
    user.hasActiveSubscription = subRows.length > 0;

    res.json(user);
  } catch (e) {
    console.error('API Error in getProfile:', e);
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({ error: 'Internal server error', ...(isDev && { details: e.message }) });
  }
};

// PUT /api/user/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, gender, dateOfBirth, phone, dietaryPreference, locationLat, locationLng, locationArea } = req.body;

    // Input validation
    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }
    if (email !== undefined && email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (dietaryPreference !== undefined && !['veg', 'non-veg', 'both', 'Veg', 'Non-Veg', 'Both'].includes(dietaryPreference)) {
      return res.status(400).json({ error: 'Dietary preference must be veg, non-veg, or both' });
    }

    // Validate date of birth
    let validDob = dateOfBirth;
    if (validDob && !/^\d{4}-\d{2}-\d{2}$/.test(validDob)) {
      validDob = null;
    }

    await db.query(
      `UPDATE Users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        gender = COALESCE(?, gender),
        dateOfBirth = COALESCE(?, dateOfBirth),
        dietaryPreference = COALESCE(?, dietaryPreference),
        locationLat = COALESCE(?, locationLat),
        locationLng = COALESCE(?, locationLng),
        locationArea = COALESCE(?, locationArea)
      WHERE id = ?`,
      [
        name || null, email || null, phone || null, gender || null, validDob || null,
        dietaryPreference || null, locationLat || null, locationLng || null, locationArea || null,
        req.user.id,
      ]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (e) {
    console.error('API Error in updateProfile:', e);
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({ error: 'Internal server error', ...(isDev && { details: e.message }) });
  }
};
