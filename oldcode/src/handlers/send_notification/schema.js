const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  token: Joi.string().required(),
  title: Joi.string().required(),
  body: Joi.string().required(),
});

module.exports = schema;
