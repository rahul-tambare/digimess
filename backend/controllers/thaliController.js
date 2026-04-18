const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// =============================================
// POST /api/thalis — Add new thali
// =============================================
exports.addThali = async (req, res) => {
  try {
    const {
      messId, name, mealTime, type, itemsIncluded, numberOfItems,
      price, discountedPrice, description, maxQtyPerDay, image,
      isSubscriptionThali, subscriptionExtraCharge
    } = req.body;

    // Verify ownership
    const [messCheck] = await db.query('SELECT id FROM Messes WHERE id = ? AND vendorId = ?', [messId, req.user.id]);
    if (messCheck.length === 0) {
      return res.status(403).json({ error: 'Unauthorized to add thalis to this mess' });
    }

    const id = uuidv4();
    await db.query(
      `INSERT INTO Thalis (id, messId, name, mealTime, type, itemsIncluded, numberOfItems,
       price, discountedPrice, description, maxQtyPerDay, image, isSubscriptionThali, subscriptionExtraCharge)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, messId, name, mealTime || 'Lunch', type || 'Veg',
        itemsIncluded, numberOfItems || 0,
        price, discountedPrice || null, description || null,
        maxQtyPerDay || null, image || null,
        isSubscriptionThali ? 1 : 0,
        (isSubscriptionThali && subscriptionExtraCharge) ? parseFloat(subscriptionExtraCharge) : 0
      ]
    );

    res.status(201).json({ message: 'Thali added successfully', id });
  } catch (e) {
    console.error('Add thali error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================
// PUT /api/thalis/:id — Update thali
// =============================================
exports.updateThali = async (req, res) => {
  try {
    const thaliId = req.params.id;
    const {
      name, mealTime, type, itemsIncluded, numberOfItems,
      price, discountedPrice, description, maxQtyPerDay, image,
      isSubscriptionThali, subscriptionExtraCharge
    } = req.body;

    // Verify ownership
    const [check] = await db.query(
      'SELECT t.id FROM Thalis t JOIN Messes m ON t.messId = m.id WHERE t.id = ? AND m.vendorId = ?',
      [thaliId, req.user.id]
    );
    if (check.length === 0) return res.status(403).json({ error: 'Unauthorized' });

    await db.query(
      `UPDATE Thalis SET
        name = COALESCE(?, name), mealTime = COALESCE(?, mealTime),
        type = COALESCE(?, type), itemsIncluded = COALESCE(?, itemsIncluded),
        numberOfItems = COALESCE(?, numberOfItems), price = COALESCE(?, price),
        discountedPrice = COALESCE(?, discountedPrice), description = COALESCE(?, description),
        maxQtyPerDay = COALESCE(?, maxQtyPerDay), image = COALESCE(?, image),
        isSubscriptionThali = COALESCE(?, isSubscriptionThali),
        subscriptionExtraCharge = COALESCE(?, subscriptionExtraCharge)
       WHERE id = ?`,
      [
        name, mealTime, type, itemsIncluded, numberOfItems,
        price, discountedPrice, description,
        maxQtyPerDay, image,
        isSubscriptionThali !== undefined ? (isSubscriptionThali ? 1 : 0) : null,
        subscriptionExtraCharge !== undefined ? (isSubscriptionThali === false ? 0 : (subscriptionExtraCharge ? parseFloat(subscriptionExtraCharge) : 0)) : null,
        thaliId
      ]
    );

    res.json({ message: 'Thali updated successfully' });
  } catch (e) {
    console.error('Update thali error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================
// DELETE /api/thalis/:id — Delete thali
// =============================================
exports.deleteThali = async (req, res) => {
  try {
    const thaliId = req.params.id;
    const [check] = await db.query(
      'SELECT t.id FROM Thalis t JOIN Messes m ON t.messId = m.id WHERE t.id = ? AND m.vendorId = ?',
      [thaliId, req.user.id]
    );
    if (check.length === 0) return res.status(403).json({ error: 'Unauthorized' });

    await db.query('DELETE FROM Thalis WHERE id = ?', [thaliId]);
    res.json({ message: 'Thali deleted successfully' });
  } catch (e) {
    console.error('Delete thali error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================
// GET /api/thalis/mess/:messId — Get all thalis for a mess
// =============================================
exports.getMessThalis = async (req, res) => {
  try {
    const { messId } = req.params;
    let query = 'SELECT * FROM Thalis WHERE messId = ?';

    // If customer, only show available
    if (!req.user || req.user.role === 'customer') {
      query += ' AND isAvailable = 1';
    }

    query += ' ORDER BY isSpecial DESC, mealTime ASC, name ASC';

    const [thalis] = await db.query(query, [messId]);
    res.json(thalis);
  } catch (e) {
    console.error('Get thalis error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================
// PATCH /api/thalis/:id/toggle — Toggle availability
// =============================================
exports.toggleAvailability = async (req, res) => {
  try {
    const thaliId = req.params.id;
    const [check] = await db.query(
      'SELECT t.id, t.isAvailable FROM Thalis t JOIN Messes m ON t.messId = m.id WHERE t.id = ? AND m.vendorId = ?',
      [thaliId, req.user.id]
    );
    if (check.length === 0) return res.status(403).json({ error: 'Unauthorized' });

    const newVal = !check[0].isAvailable;
    await db.query('UPDATE Thalis SET isAvailable = ? WHERE id = ?', [newVal, thaliId]);
    res.json({ message: `Thali is now ${newVal ? 'available' : 'unavailable'}`, isAvailable: newVal });
  } catch (e) {
    console.error('Toggle thali error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================
// PATCH /api/thalis/:id/special — Toggle daily special
// =============================================
exports.toggleSpecial = async (req, res) => {
  try {
    const thaliId = req.params.id;
    const [check] = await db.query(
      'SELECT t.id, t.isSpecial FROM Thalis t JOIN Messes m ON t.messId = m.id WHERE t.id = ? AND m.vendorId = ?',
      [thaliId, req.user.id]
    );
    if (check.length === 0) return res.status(403).json({ error: 'Unauthorized' });

    const newVal = !check[0].isSpecial;
    await db.query('UPDATE Thalis SET isSpecial = ? WHERE id = ?', [newVal, thaliId]);
    res.json({ message: `Thali is now ${newVal ? 'a daily special' : 'removed from specials'}`, isSpecial: newVal });
  } catch (e) {
    console.error('Toggle special error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
