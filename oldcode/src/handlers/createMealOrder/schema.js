const { Joi } = require("common-layer/utils/packageExports.js");

let schema = Joi.object().keys({
  userID: Joi.number().required(),
  mspID: Joi.number().required(),
  pkgID: Joi.string().allow(""),
  discount: Joi.number().allow(""),
  amount: Joi.number().required(),
  finalAmount: Joi.number().required(),
  menu: Joi.array()
    .items(
      Joi.object({
        menuID: Joi.number().required(),
        menuItems: Joi.string().required(),
        menuQTY: Joi.number().default(1),
        menuPrice: Joi.number().default(""),
      })
    )
    .required(),
  takeawaycharge: Joi.number().allow(""),
  deliveryCharge: Joi.number().allow(""),
  ordertype: Joi.string().allow(""),
  platformfee: Joi.number().allow(""),
  deliveryAddress: Joi.string().allow("").optional(),
  notes: Joi.string().allow("").optional(),
});

module.exports = schema;
