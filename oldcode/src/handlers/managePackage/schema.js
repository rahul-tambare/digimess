const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  reqtype: Joi.string().required(),
  package: Joi.string().when("type", {
    is: "u" || "s",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  price: Joi.string().when("type", {
    is: "u" || "s",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  discount: Joi.string().when("type", {
    is: "u" || "s",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  validity: Joi.string().when("type", {
    is: "u" || "s",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  status: Joi.string().when("type", {
    is: "u" || "s",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  mspno: Joi.string().when("type", {
    is: "u" || "s",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  date: Joi.string().when("type", {
    is: "u" || "s",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  packageId: Joi.string().when("type", {
    is: "u",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  city: Joi.string().when("type", {
    is: "s",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
});

module.exports = schema;
