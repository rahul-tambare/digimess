/**
 * Refund Controller — Admin refund management.
 */

const db = require('../config/db');
const refundService = require('../services/refundService');

/**
 * POST /api/admin/refunds
 * Initiate a refund.
 */
exports.initiateRefund = async (req, res) => {
  try {
    const { orderId, amount, reason, refundMethod } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ error: 'orderId and amount are required' });
    }

    const result = await refundService.initiateRefund({
      orderId,
      amount,
      reason,
      refundMethod: refundMethod || 'WALLET',
      initiatedBy: req.adminUser?.id,
      req,
    });

    res.status(201).json(result);
  } catch (e) {
    console.error('Initiate refund error:', e);
    if (e.message.includes('Over-refund') || e.message.includes('Order not found')) {
      return res.status(400).json({ error: e.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/admin/refunds
 * List refunds (paginated).
 */
exports.listRefunds = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM Refunds');

    const [rows] = await db.query(
      `SELECT r.*, o.totalAmount AS orderTotal, o.customerId,
              u.name AS customerName
       FROM Refunds r
       JOIN Orders o ON r.orderId = o.id
       JOIN Users u ON o.customerId = u.id
       ORDER BY r.createdAt DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      data: rows,
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    });
  } catch (e) {
    console.error('List refunds error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/admin/refunds/:id
 * Refund details.
 */
exports.getRefund = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, o.totalAmount AS orderTotal, o.customerId,
              u.name AS customerName
       FROM Refunds r
       JOIN Orders o ON r.orderId = o.id
       JOIN Users u ON o.customerId = u.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Refund not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Get refund error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
