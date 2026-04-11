const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  reqtype: Joi.string().required(),
});

module.exports = schema;
