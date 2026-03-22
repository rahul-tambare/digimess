const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const userController = require('../controllers/userController');
const subscriptionController = require('../controllers/subscriptionController');

router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);

router.post('/subscriptions', auth, subscriptionController.subscribe);

module.exports = router;
