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

    let response = await service.getInvoiceDetails(parameter);
    console.log(response.length);

    if (response.list.length != 0) {
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
        "No data fetched for give MSP"
      );
    }
  } catch (error) {
    console.log("Error in getInvoiceList handler: ", error);
    return getResponseObject(false, HTTP_CODE.INTERNAL_SERVER_ERROR, [], error);
  }
};
