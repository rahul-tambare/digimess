const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  userID: Joi.string().when("type", {
    is: "user",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  mspID: Joi.string().when("type", {
    is: "msp",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  type: Joi.string().required(),
  date: Joi.date().required(),
});

module.exports = schema;
