const { Joi } = require("common-layer/utils/packageExports.js");

exports.schema = Joi.object().keys({
  // Required fields for all operations
  userId: Joi.number().integer().positive().required().messages({
    "number.base": "User ID must be a number",
    "number.integer": "User ID must be an integer",
    "number.positive": "User ID must be positive",
    "any.required": "User ID is required",
  }),

  type: Joi.number().integer().valid(0, 1, 2, 3).required().messages({
    "number.base": "Type must be a number",
    "number.integer": "Type must be an integer",
    "any.only":
      "Type must be 0 (deactivate), 1 (activate), 2 (register), or 3 (get devices)",
    "any.required": "Type is required",
  }),

  // Required for type 0, 1, 2 (device operations)
  deviceId: Joi.when("type", {
    is: Joi.valid(0, 1, 2),
    then: Joi.string().min(5).max(255).required().messages({
      "string.base": "Device ID must be a string",
      "string.min": "Device ID must be at least 5 characters",
      "string.max": "Device ID cannot exceed 255 characters",
      "any.required": "Device ID is required for this operation",
    }),
    otherwise: Joi.string().optional().allow(null, ""),
  }),

  // Required for type 2 (register)
  platform: Joi.when("type", {
    is: 2,
    then: Joi.string().valid("ios", "android").required().messages({
      "string.base": "Platform must be a string",
      "any.only": "Platform must be either ios or android",
      "any.required": "Platform is required for device registration",
    }),
    otherwise: Joi.string().optional().allow(null, ""),
  }),

  // Optional fields for device registration (type 2)

  model: Joi.string().max(255).allow(null, "").optional(),

  brand: Joi.string().max(255).allow(null, "").optional(),

  systemName: Joi.string().max(50).allow(null, "").optional(),

  systemVersion: Joi.string().max(50).allow(null, "").optional(),

  buildNumber: Joi.string().max(100).allow(null, "").optional(),

  isTablet: Joi.boolean().default(false).optional(),

  appVersion: Joi.string().max(50).allow(null, "").optional(),

  // Location fields
  latitude: Joi.string().max(50).allow(null, "").optional(),

  longitude: Joi.string().max(50).allow(null, "").optional(),

  // Network information
  networkType: Joi.string().max(20).allow(null, "").optional(),

  isConnected: Joi.boolean().default(false).optional(),

  // Firebase Cloud Messaging token
  fcmToken: Joi.string().max(500).allow(null, "").optional(),

  // Registration metadata
  registrationSource: Joi.string().max(50).default("app_login").optional(),

  registeredAt: Joi.string().isoDate().optional(),

  // Optional for type 3 (get devices)
  includeInactive: Joi.boolean().default(false).optional(),
});
