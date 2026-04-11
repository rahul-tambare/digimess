const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const adminController = require('../controllers/adminController');

router.use(auth, adminController.isAdmin);

const faqController = require('../controllers/faqController');
const chargesController = require('../controllers/chargesController');

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/messes', adminController.getMesses);
router.get('/orders', adminController.getOrders);
router.post('/users/wallet', adminController.updateUserWallet);
router.get('/config', adminController.getAppConfig);
router.post('/config', adminController.updateAppConfig);
router.get('/subscriptions', adminController.getSubscriptions);

// FAQ Management
router.get('/faqs', faqController.getAllFAQs);
router.post('/faqs', faqController.createFAQ);
router.put('/faqs/:id', faqController.updateFAQ);
router.delete('/faqs/:id', faqController.deleteFAQ);

// Charges Management
router.get('/charges', chargesController.getAllCharges);
router.post('/charges', chargesController.createCharge);
router.put('/charges/:id', chargesController.updateCharge);
router.delete('/charges/:id', chargesController.deleteCharge);

module.exports = router;
