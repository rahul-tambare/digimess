const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');
const userController = require('../controllers/userController');
const subscriptionController = require('../controllers/subscriptionController');

const faqController = require('../controllers/faqController');
const notificationController = require('../controllers/notificationController');

router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);

router.get('/faqs', faqController.getFAQs);
router.post('/devices', auth, notificationController.registerDevice);

router.post('/subscriptions', auth, requireRole('customer'), subscriptionController.subscribe);
router.get('/subscriptions', auth, requireRole('customer'), subscriptionController.getMySubscriptions);
router.post('/subscriptions/:id/pause', auth, requireRole('customer'), subscriptionController.pauseSubscription);
router.post('/subscriptions/:id/resume', auth, requireRole('customer'), subscriptionController.resumeSubscription);
router.post('/subscriptions/:id/skip', auth, requireRole('customer'), subscriptionController.skipDate);
router.post('/subscriptions/:id/cancel', auth, requireRole('customer'), subscriptionController.cancelSubscription);
router.get('/subscriptions/:id/skips', auth, requireRole('customer'), subscriptionController.getSkippedDates);
router.get('/provider/subscriptions', auth, requireRole('vendor'), subscriptionController.getProviderSubscriptions);

module.exports = router;
