/**
 * Refund Routes — Admin-only, RBAC-gated.
 * Mounted under /api/admin/refunds in adminRoutes.
 */

const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');

router.post('/', refundController.initiateRefund);
router.get('/', refundController.listRefunds);
router.get('/:id', refundController.getRefund);

module.exports = router;
