const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const adminController = require('../controllers/adminController');

router.use(auth, adminController.isAdmin);

const faqController = require('../controllers/faqController');
const chargesController = require('../controllers/chargesController');
const couponController = require('../controllers/couponController');

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/messes', adminController.getMesses);
router.get('/orders', adminController.getOrders);
router.post('/users/wallet', adminController.updateUserWallet);
router.get('/config', adminController.getAppConfig);
router.post('/config', adminController.updateAppConfig);
router.get('/subscriptions', adminController.getSubscriptions);
router.get('/revenue', adminController.getRevenue);

// Mess Management
router.patch('/messes/:id/approve', adminController.approveMess);
router.patch('/messes/:id/status', adminController.toggleMessStatus);

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

// Coupon Management
router.get('/coupons', couponController.getAllCoupons);
router.post('/coupons', couponController.createCoupon);
router.put('/coupons/:id', couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);

module.exports = router;
