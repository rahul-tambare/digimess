/**
 * Settlement Routes — Admin-only, RBAC-gated.
 * Mounted under /api/admin/settlements in adminRoutes.
 */

const express = require('express');
const router = express.Router();
const settlementController = require('../controllers/settlementController');

router.post('/trigger', settlementController.triggerSettlement);
router.get('/', settlementController.listSettlements);
router.get('/:id', settlementController.getSettlement);
router.post('/:id/retry', settlementController.retrySettlement);
router.get('/vendor/:vendorId', settlementController.getVendorSettlements);

module.exports = router;
