const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  // messName: Joi.string(),
  // reqtype: Joi.string().required(),
  // status: Joi.string().when("type", {
  //     is: "u",
  //     then: Joi.required(),
  //     otherwise: Joi.string().allow("", null),
  // }),
  // mspId: Joi.string().when("type", {
  //     is: "u",
  //     then: Joi.required(),
  //     otherwise: Joi.string().allow("", null),
  // }),
});

module.exports = schema;
