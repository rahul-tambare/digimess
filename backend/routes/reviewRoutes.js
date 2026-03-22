const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const reviewValidator = require('../validators/reviewValidator');
const reviewController = require('../controllers/reviewController');

// POST /api/orders/:id/review
router.post('/', auth, validate(reviewValidator.submitReview), reviewController.submitReview);

module.exports = router;
