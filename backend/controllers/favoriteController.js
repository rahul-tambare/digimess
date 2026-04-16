const db = require('../config/db');

// GET /api/favorites — get customer's favorite messes
exports.getFavorites = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT f.id AS favoriteId, f.createdAt AS favoritedAt, m.*
       FROM Favorites f
       JOIN Messes m ON f.messId = m.id
       WHERE f.customerId = ? AND m.isDeleted = 0
       ORDER BY f.createdAt DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/favorites/:messId — add mess to favorites
exports.addFavorite = async (req, res) => {
  try {
    const { messId } = req.params;

    // Check mess exists
    const [mess] = await db.query('SELECT id FROM Messes WHERE id = ? AND isDeleted = 0', [messId]);
    if (mess.length === 0) return res.status(404).json({ error: 'Mess not found' });

    // Check if already favorited
    const [existing] = await db.query(
      'SELECT id FROM Favorites WHERE customerId = ? AND messId = ?',
      [req.user.id, messId]
    );
    if (existing.length > 0) return res.json({ message: 'Already in favorites' });

    const id = require('crypto').randomUUID();
    await db.query(
      'INSERT INTO Favorites (id, customerId, messId) VALUES (?, ?, ?)',
      [id, req.user.id, messId]
    );
    res.status(201).json({ message: 'Added to favorites', id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/favorites/:messId — remove from favorites
exports.removeFavorite = async (req, res) => {
  try {
    const { messId } = req.params;
    await db.query(
      'DELETE FROM Favorites WHERE customerId = ? AND messId = ?',
      [req.user.id, messId]
    );
    res.json({ message: 'Removed from favorites' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
