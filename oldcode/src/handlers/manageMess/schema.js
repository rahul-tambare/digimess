const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  reqtype: Joi.string().required(),
  mspId: Joi.string().required(),

  // MSP Table Fields
  MSP_NAME: Joi.string().allow("", null),
  MSP_TYPE: Joi.string().allow("", null),
  MSP_CAPACITY: Joi.number().allow("", null),
  MSP_AUTO_CNFM: Joi.number().allow("", null),
  MSP_DELIVERY: Joi.number().allow("", null),
  DINE_IN: Joi.number().allow("", null),
  TAKE_AWAY: Joi.number().allow("", null),
  MSP_LSTRT_HRS: Joi.string().allow("", null),
  MSP_LEND_HRS: Joi.string().allow("", null),
  MSP_DSTRT_HRS: Joi.string().allow("", null),
  MSP_DEND_HRS: Joi.string().allow("", null),
  MSP_APPROVED: Joi.number().allow("", null),
  MSP_CATEGORY: Joi.string().allow("", null),
  MSP_Image: Joi.string().allow("", null),
  MSP_Image2: Joi.string().allow("", null),
  MSP_Image3: Joi.string().allow("", null),

  // New fields
  MSP_RATING: Joi.number().allow("", null),
  Offer_1: Joi.string().allow("", null),
  Offer_2: Joi.string().allow("", null),
  Offer_3: Joi.string().allow("", null),
  cuisines: Joi.string().allow("", null),
  price: Joi.number().allow("", null),

  // User Table Fields
  U_FULL_NAME: Joi.string().allow("", null),
  U_EMAIL: Joi.string().allow("", null),
  U_MOBILE: Joi.string().allow("", null),
  U_DOB: Joi.string().allow("", null),

  // Address Table Fields
  AD_LINE1: Joi.string().allow("", null),
  AD_LINE2: Joi.string().allow("", null),
  AD_CITY: Joi.string().allow("", null),
  AD_STATE: Joi.string().allow("", null),
  AD_PIN: Joi.string().allow("", null),

  // Bank Details
  B_BANKNAME: Joi.string().allow("", null),
  B_ACCOUNTNUMBER: Joi.string().allow("", null),
  B_IFSCCODE: Joi.string().allow("", null),

  // Admin Charge
  ADMIN_CHG: Joi.number().allow("", null),

  // For backward compatibility
  status: Joi.number().allow("", null),
  category: Joi.string().allow("", null),
  messName: Joi.string().allow("", null),
});

module.exports = schema;
