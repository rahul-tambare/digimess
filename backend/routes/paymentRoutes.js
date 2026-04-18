/**
 * Payment Routes — Consumer payment flow.
 */

const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const paymentController = require('../controllers/paymentController');

// All payment routes require authentication
router.use(auth);

router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.get('/:id', paymentController.getPaymentSession);

module.exports = router;
