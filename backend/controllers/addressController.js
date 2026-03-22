const db = require('../config/db');

// GET /api/user/addresses
exports.getAddresses = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Addresses WHERE customerId = ? ORDER BY isDefault DESC, createdAt DESC', [req.user.id]);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/addresses
exports.addAddress = async (req, res) => {
  try {
    const { label, addressLine, area, city, pincode, isDefault, latitude, longitude } = req.body;
    if (!addressLine || !city || !pincode) {
      return res.status(400).json({ error: 'addressLine, city, and pincode are required' });
    }

    const id = require('crypto').randomUUID();

    // If this is default, clear existing default
    if (isDefault) {
      await db.query('UPDATE Addresses SET isDefault = FALSE WHERE customerId = ?', [req.user.id]);
    }

    await db.query(
      'INSERT INTO Addresses (id, customerId, label, addressLine, area, city, pincode, latitude, longitude, isDefault) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, label || 'Home', addressLine, area || null, city, pincode, latitude || null, longitude || null, isDefault ? true : false]
    );

    const [rows] = await db.query('SELECT * FROM Addresses WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/user/addresses/:id
exports.deleteAddress = async (req, res) => {
  try {
    await db.query('DELETE FROM Addresses WHERE id = ? AND customerId = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Address deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
