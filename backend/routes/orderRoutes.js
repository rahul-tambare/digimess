const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');
const orderController = require('../controllers/orderController');

router.get('/', auth, requireRole('customer'), orderController.getMyOrders);
router.get('/provider/my-orders', auth, requireRole('vendor'), orderController.getProviderOrders);
router.get('/provider/forecast', auth, requireRole('vendor'), orderController.getKitchenForecast);
router.post('/', auth, requireRole('customer'), orderController.placeOrder);
router.get('/:id', auth, requireRole('customer'), orderController.getOrderById);
router.post('/:id/reorder', auth, requireRole('customer'), orderController.reorder);
router.patch('/:id/status', auth, requireRole('vendor', 'admin'), orderController.updateOrderStatus);

module.exports = router;

