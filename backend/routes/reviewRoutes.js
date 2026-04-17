const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const reviewValidator = require('../validators/reviewValidator');
const reviewController = require('../controllers/reviewController');

// GET /api/orders/:id/review
router.get('/', auth, reviewController.getOrderReview);

// POST /api/orders/:id/review
router.post('/', auth, validate(reviewValidator.submitReview), reviewController.submitReview);

// PUT /api/orders/:id/review
router.put('/', auth, validate(reviewValidator.submitReview), reviewController.updateReview);

module.exports = router;
