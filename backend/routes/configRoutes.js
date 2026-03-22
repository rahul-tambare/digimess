const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

router.get('/config', configController.getAppConfig);
router.get('/plans', configController.getSubscriptionPlans);

module.exports = router;
