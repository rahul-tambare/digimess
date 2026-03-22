const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const addressValidator = require('../validators/addressValidator');
const addressController = require('../controllers/addressController');

router.get('/', auth, addressController.getAddresses);
router.post('/', auth, validate(addressValidator.addAddress), addressController.addAddress);
router.delete('/:id', auth, addressController.deleteAddress);

module.exports = router;
