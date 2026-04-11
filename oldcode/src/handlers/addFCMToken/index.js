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

    console.log("calling addFCMToken");
    let results = await service.addFCMToken(parameter);

    if (results.status == "SUCCESS") {
      return getResponseObject(true, HTTP_CODE.SUCCESS, [], results.message);
    } else {
      return getResponseObject(
        false,
        HTTP_CODE.INTERNAL_SERVER_ERROR,
        [],
        results.message
      );
    }
  } catch (error) {
    console.log("Error in addFCMToken handler: ", error);
    return getResponseObject(false, HTTP_CODE.INTERNAL_SERVER_ERROR, [], error);
  }
};
