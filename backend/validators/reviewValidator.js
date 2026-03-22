const Joi = require('joi');

exports.submitReview = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  reviewText: Joi.string().allow('', null),
  foodQuality: Joi.number().min(1).max(5).allow(null),
  deliveryTime: Joi.number().min(1).max(5).allow(null)
});
