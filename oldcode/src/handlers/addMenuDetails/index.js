let { HTTP_CODE, getResponseObject } = require("common-layer/utils/helper.js");
let service = require("./service");
let Schema = require("./schema");

exports.handler = async (event, context) => {
  //handler export
  try {
    let parameter = JSON.parse(event.body);
    console.log("param = ", parameter);
    let validationSchema = await Schema.validate(parameter);

    if (validationSchema.error) {
      console.log("Please send complete data " + validationSchema.error);
      return getResponseObject(
        false,
        HTTP_CODE.BAD_REQUEST,
        [],
        validationSchema.error
      );
    }

    let response = await service.addMenuDetails(parameter);
    console.log("back in main handler");
    console.log("response ", response);
    if (parameter.reqtype != "g") {
      if (response == true) {
        console.log("Returning Success");
        return getResponseObject(
          true,
          HTTP_CODE.SUCCESS,
          { isValid: true },
          "Menu added successfully"
        );
      } else {
        console.log("Returning Failure");
        return getResponseObject(
          false,
          HTTP_CODE.FAILURE,
          { isValid: true },
          "Menu addition failed"
        );
      }
    } else {
      if (response.length != 0) {
        console.log("Returning Success", response);
        return getResponseObject(
          true,
          HTTP_CODE.SUCCESS,
          { isValid: true },
          response
        );
      } else {
        console.log("Returning Failure");
        return getResponseObject(
          false,
          HTTP_CODE.FAILURE,
          { isValid: true },
          "No details found for given menuID"
        );
      }
    }
  } catch (error) {
    console.log("Error in add menu details handler: ", error);
    return getResponseObject(false, HTTP_CODE.INTERNAL_SERVER_ERROR, [], error);
  }
};
