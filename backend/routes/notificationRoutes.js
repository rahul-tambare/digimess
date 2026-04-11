const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const notificationController = require('../controllers/notificationController');

// Register device for push notifications
router.post('/register-device', auth, notificationController.registerDevice);

// Fetch user's notification history
router.get('/logs', auth, notificationController.getNotificationLogs);

module.exports = router;
