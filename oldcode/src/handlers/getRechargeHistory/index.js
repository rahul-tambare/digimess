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

    response = await service.getRechargeDetails(parameter);
    console.log(response.length);

    if (response.length != 0) {
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
        "No recharge found for given User"
      );
    }
  } catch (error) {
    console.log("Error in Recharge History handler: ", error);
    return getResponseObject(false, HTTP_CODE.INTERNAL_SERVER_ERROR, [], error);
  }
};
