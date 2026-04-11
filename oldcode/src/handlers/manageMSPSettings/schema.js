const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  mspID: Joi.number().when("type", {
    is: "u" || "g",
    then: Joi.required(),
    otherwise: Joi.number().allow(null),
  }),
  userID: Joi.number().when("type", {
    is: "s",
    then: Joi.required(),
    otherwise: Joi.number().allow(null),
  }),
  type: Joi.string().required(),
  messName: Joi.string().when("type", {
    is: "s" || "u",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  messType: Joi.string().when("type", {
    is: "s" || "u",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  capacity: Joi.number().when("type", {
    is: "s" || "u",
    then: Joi.required(),
    otherwise: Joi.number().allow(null),
  }),
  autoConfirm: Joi.number().when("type", {
    is: "s" || "u",
    then: Joi.required(),
    otherwise: Joi.number().allow(null),
  }),
  delivery: Joi.number().when("type", {
    is: "s" || "u",
    then: Joi.required(),
    otherwise: Joi.number().allow(null),
  }),
  status: Joi.string().when("type", {
    is: "s" || "u",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  l_strtHrs: Joi.string().when("type", {
    is: "s" || "u",
    then: Joi.required(),
    otherwise: Joi.string().allow(null),
  }),
  l_endHrs: Joi.string().when("type", {
    is: "s" || "u",
    then: Joi.required(),
    otherwise: Joi.string().allow(null),
  }),
  d_strtHrs: Joi.string().when("type", {
    is: "s" || "u",
    then: Joi.required(),
    otherwise: Joi.string().allow(null),
  }),
  d_endHrs: Joi.string().when("type", {
    is: "s" || "u",
    then: Joi.required(),
    otherwise: Joi.string().allow(null),
  }),
  invoice: Joi.string().when("type", {
    is: "s" || "u",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  del_chg: Joi.string().when("type", {
    is: "s" || "u",
    then: Joi.required(),
    otherwise: Joi.string().allow("", null),
  }),
  // Add the new messImageUrl field as optional
  messImageUrl: Joi.string().allow("", null),
  messImageUrl2: Joi.string().allow("", null),
  messImageUrl3: Joi.string().allow("", null),

  // // docID: Joi.string(),
  // document1: Joi.string(),
  // document2: Joi.string(),
  // document3: Joi.string(),
  // document4: Joi.string()
});

module.exports = schema;
