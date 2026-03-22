const db = require('../config/db');

// POST /api/orders — place an order
exports.placeOrder = async (req, res) => {
  try {
    const { messId, totalAmount, orderType } = req.body;
    const id = require('crypto').randomUUID();
    await db.query(
      'INSERT INTO Orders (id, customerId, messId, totalAmount, orderType) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.id, messId, totalAmount, orderType || 'on_demand']
    );
    res.status(201).json({ message: 'Order placed successfully', orderId: id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/orders — get customer's orders
exports.getMyOrders = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.*, m.name AS messName, m.images AS messImages
       FROM Orders o
       JOIN Messes m ON o.messId = m.id
       WHERE o.customerId = ?
       ORDER BY o.createdAt DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /api/orders/:id/status — update status (vendor/admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await db.query('UPDATE Orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Order status updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
