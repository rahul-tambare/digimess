const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  userID: Joi.number().required(),
  token: Joi.string().required(),
  deviceID: Joi.string().required(),
});

module.exports = schema;
