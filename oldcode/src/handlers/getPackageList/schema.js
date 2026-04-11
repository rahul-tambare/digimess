const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  usrCity: Joi.string().required(),
});

module.exports = schema;
