const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

const { Axios } = require("common-layer/utils/packageExports.js");

const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");

exports.resendOTP = async (parameter) => {
  try {
    let query =
      "select OTP, O_ID FROM TB_OTP where MOBILE = ? order by O_ID desc limit 1";
    let results = await sequelize.query(query, {
      replacements: [parameter.mobile],
      type: QueryTypes.SELECT,
    });

    let storedOTP = results?.[0]?.OTP;
    console.log("storedOTP = ", storedOTP);

    if (storedOTP != null || storedOTP != undefined) {
      const msg = `${storedOTP} is your OTP to proceed with KhanaAnywhere signup. Do not share OTP with anyone. Regards, Team KhanaAnywhere`;
      console.log("msg =", msg);
      let res = await sendSMS(parameter.mobile, msg);
      console.log("sendSMS res = ", res);
      if (res) {
        return true;
      } else return false;
    } else {
      const otp = Math.floor(1000 + Math.random() * 9000);
      const msg = `${otp}  is your OTP to proceed with KhanaAnywhere signup/login. Do not share OTP with anyone.
Regards,
Team KhanaAnywhere
9607992777`;
      console.log("msg =", msg);
      let res = await sendSMS(parameter.mobile, msg);

      if (res) {
        const sysdate = [formattedDate];

        let query = "insert into TB_OTP (OTP, MOBILE, GEN_DATE) values (?,?,?)";
        let result = await sequelize.query(query, {
          replacements: [otp, parameter.mobile, sysdate],
          type: QueryTypes.INSERT,
        });
        return true;
      } else return false;
    }
  } catch (error) {
    throw error;
  }
};

const sendSMS = async (mobile, msg) => {
  // Define the JSON object you want to send
  console.log(`mobile = ${mobile}`);
  const jsonData = [
    {
      header: "ea2a110e707044d7875e536624e75a95",
      message: msg,
      sender: "KHANAE",
      smstype: "TRANS",
      numbers: mobile,
      unicode: "no",
    },
  ];

  const config = {
    headers: {
      apikey: "e2b658cd81f940afa781b043878a21da",
    },
  };

  // Define the URL of the REST API
  const apiUrl = "http://sms.pearlsms.com/public/sms/sendjson";

  try {
    const response = await Axios.post(apiUrl, jsonData, config);
    console.log("response.status = ", response.status);
    if (response.status == 200) {
      return true;
    } else return false;
  } catch (error) {
    return error;
  }
};
