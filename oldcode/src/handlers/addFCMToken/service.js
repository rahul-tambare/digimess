const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");

exports.addFCMToken = async (parameter) => {
  const sysdate = [formattedDate];

  try {
    let response = {
      status: "",
      message: "",
    };

    let query =
      "SELECT * FROM TB_FCM_TOKENS WHERE FCM_USRID = ? and FCM_DEVICEID = ?";
    let results = await sequelize.query(query, {
      replacements: [parameter.userID, parameter.deviceID],
      type: QueryTypes.SELECT,
    });
    console.log("results = ", results);
    let storedToken = results?.[0]?.FCM_TOKEN;
    if (results.length == 0) {
      let query =
        "insert into TB_FCM_TOKENS (FCM_USRID, FCM_TOKEN, FCM_CR_DT, FCM_DEVICEID) VALUES (?,?,?,?);";
      await sequelize.query(query, {
        replacements: [
          parameter.userID,
          parameter.token,
          sysdate,
          parameter.deviceID,
        ],
        type: QueryTypes.INSERT,
      });
      response.status = "SUCCESS";
      response.message = "Token inserted Successfully";
      return response;
    } else if (storedToken != parameter.token) {
      let fcmID = results?.[0]?.FCM_ID;
      console.log("Parameter token ", parameter.token);
      console.log("Stored token ", results?.[0]?.FCM_TOKEN);
      let query =
        "update TB_FCM_TOKENS set FCM_TOKEN =? , FCM_CR_DT = ? where FCM_ID = ?;";
      await sequelize.query(query, {
        replacements: [parameter.token, sysdate, fcmID],
        type: QueryTypes.UPDATE,
      });
      response.status = "SUCCESS";
      response.message = "Token updated Successfully";
      return response;
    } else {
      console.log("Token already added");
      response.status = "SUCCESS";
      response.message = "Token already exists, Nothing updated";
      return response;
    }
  } catch (error) {
    throw error;
  }
};
