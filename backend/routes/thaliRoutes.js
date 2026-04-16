const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');
const thaliController = require('../controllers/thaliController');

// CRUD
router.post('/', auth, requireRole('vendor'), thaliController.addThali);
router.put('/:id', auth, requireRole('vendor'), thaliController.updateThali);
router.delete('/:id', auth, requireRole('vendor'), thaliController.deleteThali);

// Get thalis for a mess
router.get('/mess/:messId', thaliController.getMessThalis);

// Toggles
router.patch('/:id/toggle', auth, requireRole('vendor'), thaliController.toggleAvailability);
router.patch('/:id/special', auth, requireRole('vendor'), thaliController.toggleSpecial);

module.exports = router;
