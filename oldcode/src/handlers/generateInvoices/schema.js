const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  mspID: Joi.number().required(),
});

module.exports = schema;
