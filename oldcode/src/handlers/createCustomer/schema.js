const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  mobile: Joi.number().required(),
  email: Joi.string().required(),
  type: Joi.string().required(),
});

module.exports = schema;
