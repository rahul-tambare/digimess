const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');
const favoriteController = require('../controllers/favoriteController');

router.get('/', auth, requireRole('customer'), favoriteController.getFavorites);
router.post('/:messId', auth, requireRole('customer'), favoriteController.addFavorite);
router.delete('/:messId', auth, requireRole('customer'), favoriteController.removeFavorite);

module.exports = router;
