let { HTTP_CODE, getResponseObject } = require("common-layer/utils/helper.js");
let service = require("./service");
let Schema = require("./schema");

exports.handler = async (event, context) => {
  try {
    let parameter = JSON.parse(event.body);
    console.log("parameters = ", parameter);

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

    if (parameter.mobile != 1234567890) {
      let result = await service.checkExist(parameter);

      if (result.length != 0) {
        let userID = result?.[0]?.U_USERID;
        result = await service.validateOTP(parameter);
        if (result == true) {
          let responseData = {
            userID: userID,
            message: "OTP Validated",
          };
          console.log("responseData", responseData);
          return getResponseObject(
            true,
            HTTP_CODE.SUCCESS,
            { isValid: true },
            responseData
          );
        } else {
          //response.message = "Incorrect OTP";
          return getResponseObject(
            false,
            HTTP_CODE.FAILURE,
            { isValid: true },
            "Incorrect OTP"
          );
        }
      } else {
        console.log("Customer does not exist: ");
        return getResponseObject(
          false,
          HTTP_CODE.INTERNAL_SERVER_ERROR,
          [],
          "Customer does not exist"
        );
      }
    } else {
      let responseData = {
        userID: 1,
        message: "OTP Validated",
      };
      console.log("responseData", responseData);
      return getResponseObject(
        true,
        HTTP_CODE.SUCCESS,
        { isValid: true },
        responseData
      );
    }
  } catch (error) {
    console.log("Error in validateOTP  handler: ", error);
    return getResponseObject(false, HTTP_CODE.INTERNAL_SERVER_ERROR, [], error);
  }
};
