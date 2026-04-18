/**
 * Ledger Routes — Admin-only, RBAC-gated.
 * Mounted under /api/admin/ledger in adminRoutes.
 */

const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');
const reconciliationController = require('../controllers/reconciliationController');

// Ledger accounts
router.get('/accounts', ledgerController.listAccounts);
router.get('/accounts/:id', ledgerController.getAccountDetail);

// Reconciliation
router.post('/reconcile', reconciliationController.triggerReconciliation);
router.get('/reports', reconciliationController.listReports);

module.exports = router;
