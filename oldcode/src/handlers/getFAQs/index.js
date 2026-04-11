let { HTTP_CODE, getResponseObject } = require("common-layer/utils/helper.js");
let service = require("./service");

exports.handler = async (event, context) => {
  let parameter = JSON.parse(event.body);

  try {
    const response = await service.getFAQs(parameter);
    console.log(JSON.stringify({ message: response }));
    return getResponseObject(
      true,
      HTTP_CODE.SUCCESS,
      { isValid: true },
      response
    );
  } catch (error) {
    console.log("Error in create entry handler: ", error);
    return getResponseObject(false, HTTP_CODE.INTERNAL_SERVER_ERROR, [], error);
  }
};
