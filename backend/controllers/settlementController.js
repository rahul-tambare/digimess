/**
 * Settlement Controller — Admin settlement management.
 */

const db = require('../config/db');
const settlementService = require('../services/settlementService');
const { logAudit } = require('../services/auditService');

/**
 * POST /api/admin/settlements/trigger
 * Trigger settlement run for all eligible vendors.
 */
exports.triggerSettlement = async (req, res) => {
  try {
    const results = await settlementService.triggerSettlements('ADMIN', req.adminUser?.id);

    await logAudit(req.adminUser?.id, 'ADMIN', 'settlement.trigger', 'SETTLEMENT', null, {
      newState: results,
      req,
    });

    res.json({ message: 'Settlement run completed', ...results });
  } catch (e) {
    console.error('Settlement trigger error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/admin/settlements
 * List settlements (paginated).
 */
exports.listSettlements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || null;

    let whereClause = '1=1';
    const params = [];
    if (status) {
      whereClause += ' AND s.status = ?';
      params.push(status);
    }

    const [[{ count }]] = await db.query(
      `SELECT COUNT(*) as count FROM Settlements s WHERE ${whereClause}`,
      params
    );

    const [rows] = await db.query(
      `SELECT s.*, u.name AS vendorName, m.name AS messName
       FROM Settlements s
       JOIN Users u ON s.vendorId = u.id
       JOIN Messes m ON s.messId = m.id
       WHERE ${whereClause}
       ORDER BY s.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      data: rows,
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    });
  } catch (e) {
    console.error('List settlements error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/admin/settlements/:id
 * Settlement detail.
 */
exports.getSettlement = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, u.name AS vendorName, m.name AS messName
       FROM Settlements s
       JOIN Users u ON s.vendorId = u.id
       JOIN Messes m ON s.messId = m.id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Settlement not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Get settlement error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/admin/settlements/:id/retry
 * Retry a failed settlement.
 */
exports.retrySettlement = async (req, res) => {
  try {
    const result = await settlementService.retrySettlement(req.params.id);

    await logAudit(req.adminUser?.id, 'ADMIN', 'settlement.retried', 'SETTLEMENT', req.params.id, {
      newState: result,
      req,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (e) {
    console.error('Retry settlement error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/admin/settlements/vendor/:vendorId
 * Vendor settlement history.
 */
exports.getVendorSettlements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) as count FROM Settlements WHERE vendorId = ?',
      [req.params.vendorId]
    );

    const [rows] = await db.query(
      `SELECT s.*, m.name AS messName
       FROM Settlements s
       JOIN Messes m ON s.messId = m.id
       WHERE s.vendorId = ?
       ORDER BY s.createdAt DESC
       LIMIT ? OFFSET ?`,
      [req.params.vendorId, limit, offset]
    );

    res.json({
      data: rows,
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    });
  } catch (e) {
    console.error('Vendor settlements error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
