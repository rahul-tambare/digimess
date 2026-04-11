const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  orderID: Joi.number().required(),
  status: Joi.string().required(),
});

module.exports = schema;
