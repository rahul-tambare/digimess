const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  pincode: Joi.number().required(),
  consLat: Joi.number().allow(""),
  consLon: Joi.number().allow(""),
});

module.exports = schema;
