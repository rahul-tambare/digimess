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
    let result = await service.resendOTP(parameter);
    if (result == true) {
      return getResponseObject(
        true,
        HTTP_CODE.SUCCESS,
        { isValid: true },
        "OTP Send Successfully"
      );
    } else {
      //response.message = "Incorrect OTP";
      return getResponseObject(
        false,
        HTTP_CODE.FAILURE,
        { isValid: true },
        "Failed while sending OTP"
      );
    }
  } catch (error) {
    console.log("Error in resendOTP  handler: ", error);
    return getResponseObject(false, HTTP_CODE.INTERNAL_SERVER_ERROR, [], error);
  }
};
