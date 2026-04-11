const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  userId: Joi.required(),
});

module.exports = schema;
