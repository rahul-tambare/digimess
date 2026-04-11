const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const userController = require('../controllers/userController');
const subscriptionController = require('../controllers/subscriptionController');

const faqController = require('../controllers/faqController');
const notificationController = require('../controllers/notificationController');

router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);

router.get('/faqs', faqController.getFAQs);
router.post('/devices', auth, notificationController.registerDevice);

router.post('/subscriptions', auth, subscriptionController.subscribe);
router.get('/subscriptions', auth, subscriptionController.getMySubscriptions);
router.post('/subscriptions/:id/pause', auth, subscriptionController.pauseSubscription);
router.post('/subscriptions/:id/resume', auth, subscriptionController.resumeSubscription);

module.exports = router;
