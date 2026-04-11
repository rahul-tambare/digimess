const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  type: Joi.number().required(),
  userID: Joi.number().when("type", {
    is: 1,
    then: Joi.required(),
    otherwise: Joi.number().allow(null),
  }),
  mspID: Joi.number().when("type", {
    is: 2,
    then: Joi.required(),
    otherwise: Joi.number().allow(null),
  }),
  status: Joi.boolean().when("type", {
    is: 2,
    then: Joi.required(),
    otherwise: Joi.boolean().allow(null),
  }),
});

module.exports = schema;
