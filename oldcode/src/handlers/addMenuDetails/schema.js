const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  reqtype: Joi.string().required(),
  menuID: Joi.number().when("reqtype", {
    is: Joi.valid("u", "d", "g"),
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  mspID: Joi.string().when("reqtype", {
    is: Joi.valid("s", "u"),
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  title: Joi.string().when("reqtype", {
    is: Joi.valid("s", "u"),
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  type: Joi.string().when("reqtype", {
    is: Joi.valid("s", "u"),
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  quantity: Joi.string().when("reqtype", {
    is: Joi.valid("s", "u"),
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  price: Joi.number().when("reqtype", {
    is: Joi.valid("s", "u"),
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  takeaway: Joi.number().when("reqtype", {
    is: Joi.valid("s", "u"),
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  status: Joi.string().when("reqtype", {
    is: Joi.valid("s", "u"),
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  menuCatgeory: Joi.string().when("reqtype", {
    is: Joi.valid("s", "u"),
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  // Fix: Allow menuImageUrl in the schema
  menuImageUrl: Joi.string().allow("", null),
  menuNotes: Joi.string().allow("", null),
  menu: Joi.array()
    .items(
      Joi.object({
        menuDetailsID: Joi.alternatives()
          .try(Joi.number(), Joi.string())
          .allow(null, ""),
        menuCatID: Joi.alternatives()
          .try(Joi.number(), Joi.string())
          .required(),
        menuItemID: Joi.alternatives()
          .try(Joi.number(), Joi.string())
          .required(),
        menuQTY: Joi.number().required(),
        menuTag: Joi.string().required(),
      })
    )
    .when("reqtype", {
      is: Joi.valid("s"),
      then: Joi.required(),
      otherwise: Joi.allow(null),
    }),
});

module.exports = schema;
