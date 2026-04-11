const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  status: Joi.string().required(),
  userid: Joi.string().required(),
});

module.exports = schema;
