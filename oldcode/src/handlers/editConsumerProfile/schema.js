const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  firstName: Joi.string().allow("", null),
  lastName: Joi.string().allow("", null),
  email: Joi.string().allow("", null),
  mobile: Joi.string().allow("", null),
  gender: Joi.string().allow("", null),
  dob: Joi.date().allow("", null),
  userId: Joi.number().required(),
});

module.exports = schema;
