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

    let response = await service.editConsumerProfile(parameter);
    console.log("back in main handler");

    if (response == true) {
      return getResponseObject(
        true,
        HTTP_CODE.SUCCESS,
        { isValid: true },
        "Data updated successfully"
      );
    } else {
      return getResponseObject(
        false,
        response.statusCode,
        { isValid: true },
        "data updation failed"
      );
    }
  } catch (error) {
    console.log("Error in editConsumerProfile handler: ", error);
    return getResponseObject(false, HTTP_CODE.INTERNAL_SERVER_ERROR, [], error);
  }
};
