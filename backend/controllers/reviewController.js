const db = require('../config/db');

// POST /api/orders/:id/review
exports.submitReview = async (req, res) => {
  try {
    const { rating, reviewText, foodQuality, deliveryTime } = req.body;
    const orderId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get the order to find the messId and verify ownership
    const [orders] = await db.query('SELECT * FROM Orders WHERE id = ? AND customerId = ?', [orderId, req.user.id]);
    if (!orders[0]) return res.status(404).json({ error: 'Order not found' });

    const order = orders[0];

    // Check if review already exists for this order
    const [existing] = await db.query('SELECT id FROM Reviews WHERE orderId = ?', [orderId]);
    if (existing[0]) return res.status(409).json({ error: 'Review already submitted for this order' });

    const id = require('crypto').randomUUID();
    await db.query(
      'INSERT INTO Reviews (id, orderId, customerId, messId, rating, reviewText, foodQuality, deliveryTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, orderId, req.user.id, order.messId, rating, reviewText || null, foodQuality || null, deliveryTime || null]
    );

    // Update the mess average rating
    await db.query(
      'UPDATE Messes SET rating = (SELECT AVG(rating) FROM Reviews WHERE messId = ?) WHERE id = ?',
      [order.messId, order.messId]
    );

    res.status(201).json({ message: 'Review submitted successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/messes/:id/reviews
exports.getMessReviews = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, u.name as userName FROM Reviews r
       LEFT JOIN Users u ON r.customerId = u.id
       WHERE r.messId = ? ORDER BY r.createdAt DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/messes/provider/reviews
exports.getProviderReviews = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, u.name as customerName, m.name as messName
       FROM Reviews r
       JOIN Messes m ON r.messId = m.id
       JOIN Users u ON r.customerId = u.id
       WHERE m.vendorId = ?
       ORDER BY r.createdAt DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error fetching provider reviews' });
  }
};

// GET /api/orders/:id/review
exports.getOrderReview = async (req, res) => {
  try {
    const orderId = req.params.id;
    const [rows] = await db.query('SELECT * FROM Reviews WHERE orderId = ? AND customerId = ?', [orderId, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Review not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/orders/:id/review
exports.updateReview = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { rating, reviewText, foodQuality, deliveryTime } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const [existing] = await db.query('SELECT id, messId FROM Reviews WHERE orderId = ? AND customerId = ?', [orderId, req.user.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Review not found to update' });
    
    const reviewId = existing[0].id;
    const messId = existing[0].messId;

    await db.query(
      'UPDATE Reviews SET rating = ?, reviewText = ?, foodQuality = ?, deliveryTime = ? WHERE id = ?',
      [rating, reviewText || null, foodQuality || null, deliveryTime || null, reviewId]
    );

    // Update mess average rating
    await db.query(
      'UPDATE Messes SET rating = (SELECT AVG(rating) FROM Reviews WHERE messId = ?) WHERE id = ?',
      [messId, messId]
    );

    res.json({ message: 'Review updated successfully' });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
