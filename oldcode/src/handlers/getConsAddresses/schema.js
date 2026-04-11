const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  userID: Joi.number().required(),
});

module.exports = schema;
