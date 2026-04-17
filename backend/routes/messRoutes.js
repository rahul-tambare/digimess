const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');
const messController = require('../controllers/messController');

router.get('/', messController.getAllMesses);
router.get('/provider/my-messes', auth, requireRole('vendor'), messController.getMyMesses);
router.get('/provider/reviews', auth, requireRole('vendor'), require('../controllers/reviewController').getProviderReviews);
router.get('/:id/reviews', require('../controllers/reviewController').getMessReviews);
router.get('/:id', messController.getMessById);
router.post('/register', auth, requireRole('vendor'), messController.registerMess);
router.put('/:id', auth, requireRole('vendor'), messController.updateMess);
router.put('/:id/settings', auth, requireRole('vendor'), messController.updateMessSettings);

module.exports = router;
