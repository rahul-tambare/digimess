const Joi = require('joi');

exports.addAddress = Joi.object({
  label: Joi.string().valid('Home', 'Work', 'Other').default('Home'),
  addressLine: Joi.string().required(),
  area: Joi.string().allow('', null),
  city: Joi.string().required(),
  pincode: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
  latitude: Joi.number().allow(null),
  longitude: Joi.number().allow(null),
  isDefault: Joi.boolean().default(false)
});
