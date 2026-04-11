const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  userID: Joi.string().required(),
  reqtype: Joi.string().required(),
  addID: Joi.string(),
  line1: Joi.string().when("type", {
    is: "s",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  line2: Joi.string().when("type", {
    is: "s",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  city: Joi.string().when("type", {
    is: "s",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  state: Joi.string().when("type", {
    is: "s",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  pincode: Joi.string().when("type", {
    is: "s",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  latitude: Joi.string().when("type", {
    is: "s",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  longitude: Joi.string().when("type", {
    is: "s",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
});

module.exports = schema;
