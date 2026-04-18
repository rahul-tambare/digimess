const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const walletController = require('../controllers/walletController');

router.get('/balance', auth, walletController.getBalance);
router.post('/topup', auth, walletController.topUp);
router.post('/topup/razorpay', auth, walletController.createTopupOrder);
router.get('/transactions', auth, walletController.getTransactions);

module.exports = router;
