const service = require("./service");
const { schema } = require("./schema");
const {
  HTTP_CODE,
  getResponseObject,
} = require("common-layer/utils/helper.js");

exports.handler = async (event, context) => {
  try {
    const parameter = JSON.parse(event.body);

    // Validate incoming data
    const validationResult = schema.validate(parameter);

    if (validationResult.error) {
      console.log("Validation error: " + validationResult.error);
      return getResponseObject(
        false,
        HTTP_CODE.BAD_REQUEST,
        [],
        "Invalid data: " + validationResult.error.details[0].message
      );
    }

    console.log("Device Management Request - ", {
      userId: parameter.userId,
      deviceId: parameter.deviceId,
      platform: parameter.platform,
      type: parameter.type,
    });

    let response;

    // Handle different operations based on type
    switch (parameter.type) {
      case 2: // Register/Update device
        response = await service.registerDevice(parameter);
        break;
      case 1: // Activate device
        response = await service.activateDevice(parameter);
        break;
      case 0: // Deactivate device
        response = await service.deactivateDevice(parameter);
        break;
      case 3: // Get user devices
        response = await service.getUserDevices(parameter);
        break;
      default:
        return getResponseObject(
          false,
          HTTP_CODE.BAD_REQUEST,
          [],
          "Invalid type. Use 0=deactivate, 1=activate, 2=register, 3=get_devices"
        );
    }

    if (response.success) {
      return getResponseObject(
        true,
        HTTP_CODE.SUCCESS,
        response.data,
        response.message
      );
    } else {
      return getResponseObject(
        false,
        HTTP_CODE.FAILURE,
        [],
        response.message || "Operation failed"
      );
    }
  } catch (error) {
    console.log("Error in device management handler: ", error);
    return getResponseObject(
      false,
      HTTP_CODE.INTERNAL_SERVER_ERROR,
      [],
      "Internal server error: " + error.message
    );
  }
};
