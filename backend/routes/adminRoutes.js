const express = require('express');
const router = express.Router();
const adminAuth = require('../middlewares/adminAuth');
const requirePermission = require('../middlewares/requirePermission');
const adminController = require('../controllers/adminController');
const rbacController = require('../controllers/rbacController');
const adminUserController = require('../controllers/adminUserController');
const faqController = require('../controllers/faqController');
const chargesController = require('../controllers/chargesController');
const couponController = require('../controllers/couponController');
const settlementRoutes = require('../routes/settlementRoutes');
const refundRoutes = require('../routes/refundRoutes');
const ledgerRoutes = require('../routes/ledgerRoutes');

// All admin routes require admin authentication
router.use(adminAuth);

// ─── Dashboard ──────────────────────────────────────────
router.get('/stats', requirePermission('dashboard:read'), adminController.getStats);

// ─── Users (customers/vendors) ──────────────────────────
router.get('/users', requirePermission('users:read'), adminController.getUsers);
router.post('/users/wallet', requirePermission('users:update'), adminController.updateUserWallet);

// ─── Messes ─────────────────────────────────────────────
router.get('/messes', requirePermission('messes:read'), adminController.getMesses);
router.patch('/messes/:id/approve', requirePermission('messes:update'), adminController.approveMess);
router.patch('/messes/:id/status', requirePermission('messes:update'), adminController.toggleMessStatus);

// ─── Orders ─────────────────────────────────────────────
router.get('/orders', requirePermission('orders:read'), adminController.getOrders);

// ─── Subscriptions ──────────────────────────────────────
router.get('/subscriptions', requirePermission('subscriptions:read'), adminController.getSubscriptions);

// ─── Revenue ────────────────────────────────────────────
router.get('/revenue', requirePermission('revenue:read'), adminController.getRevenue);

// ─── App Config ─────────────────────────────────────────
router.get('/config', requirePermission('settings:read'), adminController.getAppConfig);
router.post('/config', requirePermission('settings:update'), adminController.updateAppConfig);

// ─── FAQs ───────────────────────────────────────────────
router.get('/faqs', requirePermission('settings:read'), faqController.getAllFAQs);
router.post('/faqs', requirePermission('settings:update'), faqController.createFAQ);
router.put('/faqs/:id', requirePermission('settings:update'), faqController.updateFAQ);
router.delete('/faqs/:id', requirePermission('settings:update'), faqController.deleteFAQ);

// ─── Charges ────────────────────────────────────────────
router.get('/charges', requirePermission('settings:read'), chargesController.getAllCharges);
router.post('/charges', requirePermission('settings:update'), chargesController.createCharge);
router.put('/charges/:id', requirePermission('settings:update'), chargesController.updateCharge);
router.delete('/charges/:id', requirePermission('settings:update'), chargesController.deleteCharge);

// ─── Coupons ────────────────────────────────────────────
router.get('/coupons', requirePermission('settings:read'), couponController.getAllCoupons);
router.post('/coupons', requirePermission('settings:update'), couponController.createCoupon);
router.put('/coupons/:id', requirePermission('settings:update'), couponController.updateCoupon);
router.delete('/coupons/:id', requirePermission('settings:update'), couponController.deleteCoupon);

// ─── RBAC: Roles & Permissions ──────────────────────────
router.get('/rbac/roles', requirePermission('roles:read'), rbacController.getRoles);
router.get('/rbac/roles/:id', requirePermission('roles:read'), rbacController.getRoleById);
router.post('/rbac/roles', requirePermission('roles:create'), rbacController.createRole);
router.put('/rbac/roles/:id', requirePermission('roles:update'), rbacController.updateRole);
router.delete('/rbac/roles/:id', requirePermission('roles:delete'), rbacController.deleteRole);
router.get('/rbac/permissions', requirePermission('roles:read'), rbacController.getPermissions);
router.put('/rbac/roles/:id/permissions', requirePermission('roles:update'), rbacController.assignPermissions);

// ─── RBAC: Admin User Management ────────────────────────
router.get('/rbac/admins', requirePermission('admins:read'), adminUserController.getAdminUsers);
router.get('/rbac/admins/:id', requirePermission('admins:read'), adminUserController.getAdminUserById);
router.post('/rbac/admins', requirePermission('admins:create'), adminUserController.createAdminUser);
router.put('/rbac/admins/:id', requirePermission('admins:update'), adminUserController.updateAdminUser);
router.delete('/rbac/admins/:id', requirePermission('admins:delete'), adminUserController.deleteAdminUser);
router.post('/rbac/admins/:id/reset-password', requirePermission('admins:update'), adminUserController.resetPassword);

// ─── Settlements ────────────────────────────────────────
router.use('/settlements', requirePermission('settlements:read'), settlementRoutes);

// ─── Refunds ────────────────────────────────────────────
router.use('/refunds', requirePermission('refunds:read'), refundRoutes);

// ─── Ledger & Reconciliation ────────────────────────────
router.use('/ledger', requirePermission('ledger:read'), ledgerRoutes);

module.exports = router;
