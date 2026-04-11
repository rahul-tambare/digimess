const admin = require("common-layer/node_modules/firebase-admin");
const serviceAccount = require("./service.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

exports.send_notification = async (parameter) => {
  console.log("Inside sendNotification method");
  try {
    const { token, title, body } = parameter;

    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
      },
      data: {
        extraData: "some_data", // Optional custom data
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default-channel-id",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    console.log("Sending notification:", message);

    const response = await admin.messaging().send(message);

    console.log("Notification sent successfully:", response);

    return {
      success: true,
      messageId: response,
    };
  } catch (error) {
    console.error("Error sending notification:", error);

    if (error.code === "messaging/registration-token-not-registered") {
      console.error(
        "Token is invalid or expired. Renewal of token is required"
      );
    }

    return {
      success: false,
      error: error.message,
    };
  }
};
