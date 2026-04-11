let { HTTP_CODE, getResponseObject } = require("common-layer/utils/helper.js");
let service = require("./service");
let Schema = require("./schema");

exports.handler = async (event, context) => {
  try {
    let parameter = JSON.parse(event.body);

    let validationSchema = await Schema.validate(parameter);

    if (validationSchema.error) {
      console.log("Please send complete data " + validationSchema.error);
      return getResponseObject(
        false,
        HTTP_CODE.INTERNAL_SERVER_ERROR,
        [],
        validationSchema.error
      );
    }
    let response = await service.checkExist(parameter);

    if (response.length == 0) {
      let otpVal = await service.sendOTP(parameter.mobile);
      console.log("otpVal = ", otpVal);
      if (otpVal) {
        response = await service.createCustomer(parameter);
      }
      return getResponseObject(
        true,
        HTTP_CODE.SUCCESS,
        { isValid: true },
        response
      );
    } else {
      console.log("Customer with phone number already exists: ");
      return getResponseObject(
        false,
        HTTP_CODE.INTERNAL_SERVER_ERROR,
        [],
        "Customer already exists"
      );
    }
  } catch (error) {
    console.log("Error in createCustomer entry handler: ", error);
    return getResponseObject(false, HTTP_CODE.INTERNAL_SERVER_ERROR, [], error);
  }
};
