const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  userID: Joi.string().required(),
  amount: Joi.number().required(),
  status: Joi.string().required(),
  packageID: Joi.string().allow("", null),
  packageVal: Joi.string().allow("", null),
  type: Joi.string().required(),
  cfOrderID: Joi.string().when("type", {
    is: "final",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  cfNotes: Joi.string().when("type", {
    is: "final",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  rechargeID: Joi.string().when("type", {
    is: "final",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
});

module.exports = schema;
