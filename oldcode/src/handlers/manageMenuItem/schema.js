const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  reqtype: Joi.string().required(),
  itemname: Joi.string().when("type", {
    is: "u",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  itemtype: Joi.string().when("type", {
    is: "u",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  id: Joi.string().when("type", {
    is: "u",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
});

module.exports = schema;
