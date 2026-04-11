const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  userID: Joi.number().required(),
  type: Joi.string().required(),
  bankName: Joi.string().when("type", {
    is: "save",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  accountNo: Joi.string().when("type", {
    is: "save",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  accntName: Joi.string().when("type", {
    is: "save",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  ifsc: Joi.string().when("type", {
    is: "save",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  bID: Joi.string().when("type", {
    is: "edit",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
});

module.exports = schema;
