const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  mobile: Joi.number().required(),
  type: Joi.string().required(),
});

module.exports = schema;
