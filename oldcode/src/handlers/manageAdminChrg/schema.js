const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  reqtype: Joi.string().required(),
  admincharge: Joi.string().when("type", {
    is: "u",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  status: Joi.string().when("type", {
    is: "u",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  mspid: Joi.string().when("type", {
    is: "u",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
});

module.exports = schema;
