/**
 * Reconciliation Controller — Admin reconciliation management.
 */

const db = require('../config/db');
const reconciliationService = require('../services/reconciliationService');
const { logAudit } = require('../services/auditService');

/**
 * POST /api/admin/ledger/reconcile
 * Trigger reconciliation.
 */
exports.triggerReconciliation = async (req, res) => {
  try {
    const { date } = req.body;
    const reportDate = date ? new Date(date) : undefined;

    const report = await reconciliationService.runReconciliation(reportDate);

    await logAudit(req.adminUser?.id, 'ADMIN', 'reconciliation.triggered', 'RECONCILIATION', report.id, {
      newState: { matchedCount: report.matchedCount, mismatchedCount: report.mismatchedCount },
      req,
    });

    res.json(report);
  } catch (e) {
    console.error('Reconciliation trigger error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/admin/ledger/reports
 * List reconciliation reports.
 */
exports.listReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM ReconciliationReports');
    const [rows] = await db.query(
      'SELECT * FROM ReconciliationReports ORDER BY reportDate DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json({
      data: rows,
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    });
  } catch (e) {
    console.error('List reports error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
