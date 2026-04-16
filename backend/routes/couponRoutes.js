const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const couponController = require('../controllers/couponController');

router.post('/validate', auth, couponController.validateCoupon);

module.exports = router;
