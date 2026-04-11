let { HTTP_CODE, getResponseObject } = require("common-layer/utils/helper.js");
let service = require("./service");
let Schema = require("./schema");

exports.handler = async (event, context) => {
  let parameter = JSON.parse(event.body);
  console.log("parameters = ", parameter);
  let validationSchema = await Schema.validate(parameter);

  if (validationSchema.error) {
    console.log("Please send complete data " + validationSchema.error);
    getResponseObject(
      false,
      HTTP_CODE.INTERNAL_SERVER_ERROR,
      [],
      validationSchema.error
    );
  }

  try {
    const result = await service.manageMSPAddress(parameter);

    console.log("result ### " + result);
    if (result.result == true) {
      return getResponseObject(
        true,
        HTTP_CODE.SUCCESS,
        { isValid: true },
        result
      );
    } else
      return getResponseObject(
        false,
        HTTP_CODE.INTERNAL_SERVER_ERROR,
        { isValid: true },
        result
      );
  } catch (error) {
    console.error("Error in manageConsAddress  entry handler: ", error);
    return getResponseObject(false, HTTP_CODE.INTERNAL_SERVER_ERROR, [], error);
  }
};
