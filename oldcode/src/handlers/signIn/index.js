let { HTTP_CODE, getResponseObject } = require("common-layer/utils/helper.js");
let service = require("./service");
let Schema = require("./schema");

exports.handler = async (event, context) => {
  try {
    let parameter = JSON.parse(event.body);
    console.log("Parameters - ", parameter);

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

    // let mobile = parameter.mobile;
    if (parameter.mobile != 1234567890) {
      // condition for dummy user
      let response = await service.checkExist(parameter);

      if (response.length != 0) {
        console.log("calling sendOTP");
        let otpVal = await service.sendOTP(parameter.mobile);
        console.log("otpVal = ", otpVal);

        if (otpVal) {
          return getResponseObject(true, HTTP_CODE.SUCCESS, [], "OTP Sent");
        } else {
          return getResponseObject(
            false,
            HTTP_CODE.INTERNAL_SERVER_ERROR,
            [],
            "Failed while send SMS. Please try again"
          );
        }
      } else {
        return getResponseObject(
          false,
          HTTP_CODE.INTERNAL_SERVER_ERROR,
          [],
          "Customer does not exist"
        );
      }
    } else {
      return getResponseObject(true, HTTP_CODE.SUCCESS, [], "OTP Sent");
    }
  } catch (error) {
    console.log("Error in signIN handler: ", error);
    return getResponseObject(false, HTTP_CODE.INTERNAL_SERVER_ERROR, [], error);
  }
};
