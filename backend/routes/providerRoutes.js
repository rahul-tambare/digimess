const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');
const providerController = require('../controllers/providerController');

// Dashboard
router.get('/dashboard', auth, requireRole('vendor'), providerController.getDashboard);

// Earnings & Transactions
router.get('/earnings', auth, requireRole('vendor'), providerController.getEarnings);
router.get('/earnings/transactions', auth, requireRole('vendor'), providerController.getTransactions);

// Profile
router.put('/profile', auth, requireRole('vendor'), providerController.updateProfile);

// Mess Toggle
router.patch('/mess/toggle', auth, requireRole('vendor'), providerController.toggleMess);

// Single order detail
router.get('/orders/:id', auth, requireRole('vendor'), providerController.getOrderDetail);

// Business Stats
router.get('/stats', auth, requireRole('vendor'), providerController.getBusinessStats);

// Settlements & Ledger
router.get('/settlements', auth, requireRole('vendor'), providerController.getMySettlements);
router.get('/ledger', auth, requireRole('vendor'), providerController.getMyLedger);


module.exports = router;
