const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const authValidator = require('../validators/authValidator');

router.post('/send-otp', validate(authValidator.sendOTP), authController.sendOTP);
router.post('/verify-otp', validate(authValidator.verifyOTP), authController.verifyOTP);
router.post('/admin-login', validate(authValidator.adminLogin), authController.adminLogin);

module.exports = router;
