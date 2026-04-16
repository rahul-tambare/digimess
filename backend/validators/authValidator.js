const Joi = require('joi');

const phoneSchema = Joi.alternatives().try(
  Joi.string().length(10).pattern(/^[0-9]+$/),
  Joi.number().integer().min(1000000000).max(9999999999)
).required().messages({
  'alternatives.types': 'Phone number must be a 10-digit string or number',
  'string.length': 'Phone number must be 10 digits',
  'number.min': 'Phone number must be 10 digits',
  'number.max': 'Phone number must be 10 digits'
});

const otpSchema = Joi.alternatives().try(
  Joi.string().length(6).pattern(/^[0-9]+$/),
  Joi.number().integer().min(100000).max(999999)
).required();

exports.sendOTP = Joi.object({
  phone: phoneSchema
});

exports.verifyOTP = Joi.object({
  phone: phoneSchema,
  otp: otpSchema,
  role: Joi.string().valid('customer', 'vendor', 'admin').optional()
});

exports.adminLogin = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});
