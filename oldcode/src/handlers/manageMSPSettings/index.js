let { HTTP_CODE, getResponseObject } = require("common-layer/utils/helper.js");
let service = require("./service");
let Schema = require("./schema");

exports.handler = async (event, context) => {
  try {
    console.log(event.body);
    console.log("Test1");
    let parameter = JSON.parse(event.body) || {};
    console.log("Test");
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
    console.log("Parameters - ", parameter);
    let response = await service.manageMessDetails(parameter);
    console.log("response - ", response);

    if (response.status == true) {
      return getResponseObject(
        true,
        HTTP_CODE.SUCCESS,
        { isValid: true },
        response
      );
    } else {
      return getResponseObject(
        false,
        HTTP_CODE.FAILURE,
        { isValid: true },
        response.msg
      );
    }
  } catch (error) {
    console.log("Error in manageMess Detail handler: ", error);
    return getResponseObject(false, HTTP_CODE.INTERNAL_SERVER_ERROR, [], error);
  }
};
