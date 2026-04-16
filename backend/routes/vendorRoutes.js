const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');
const vendorController = require('../controllers/vendorController');

router.get('/bank-details', auth, requireRole('vendor'), vendorController.getBankDetails);
router.post('/bank-details', auth, requireRole('vendor'), vendorController.createBankDetails);
router.put('/bank-details', auth, requireRole('vendor'), vendorController.updateBankDetails);

module.exports = router;
