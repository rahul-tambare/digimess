const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const invoiceController = require('../controllers/invoiceController');

router.post('/generate', auth, invoiceController.generateInvoices);
router.get('/items', auth, invoiceController.getInvoiceItems);

module.exports = router;
