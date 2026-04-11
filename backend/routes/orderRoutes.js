const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const orderController = require('../controllers/orderController');

router.get('/', auth, orderController.getMyOrders);
router.get('/provider/my-orders', auth, orderController.getProviderOrders);
router.get('/provider/forecast', auth, orderController.getKitchenForecast);
router.post('/', auth, orderController.placeOrder);
router.patch('/:id/status', auth, orderController.updateOrderStatus);

module.exports = router;
