const admin = require("common-layer/node_modules/firebase-admin");
const serviceAccount = require("./service.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.getFCMToken = async (parameter) => {
  try {
    const userId = parameter.userId;
    console.log("userId:", userId);

    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return { tokens: [], message: "User not found" };
    }

    const { FCMTokens } = userDoc.data();

    if (!FCMTokens || FCMTokens.length === 0) {
      return { tokens: [], message: "No FCM tokens found for this user" };
    }

    console.log("FCMTokens:", FCMTokens);
    console.log("User ID:", userId);

    return {
      userId: userId,
      tokens: FCMTokens,
    };
  } catch (error) {
    throw error;
  }
};
