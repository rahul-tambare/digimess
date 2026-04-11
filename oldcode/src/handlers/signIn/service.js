const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");
//const sms = require("common-layer/utils/sendSMS");
const { Axios } = require("common-layer/utils/packageExports.js");
const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");

exports.checkExist = async (parameter) => {
  console.log("Inside checkExists");
  try {
    let query = `select * FROM TB_USER where U_MOBILE = ? and U_TYPE = ? and U_STATUS = "active"`;
    let result = await sequelize.query(query, {
      replacements: [parameter.mobile, parameter.type],
      type: QueryTypes.SELECT,
    });
    console.log(query);
    return result;
  } catch (error) {
    throw error;
  }
};

exports.sendOTP = async (mobile) => {
  console.log("Inside sendOTP");
  try {
    const otp = Math.floor(1000 + Math.random() * 9000);
    const msg = `${otp} is your OTP to proceed with KhanaAnywhere signup/login. Do not share OTP with anyone.
Regards,
Team KhanaAnywhere
9607992777`;
    console.log("calling sendSMS");
    console.log(msg);
    let res = await sendSMS(mobile, msg);

    console.log("res.data = ", res);

    if (res) {
      const sysdate = [formattedDate];

      let query = "insert into TB_OTP (OTP, MOBILE, GEN_DATE) values (?,?,?)";
      let result = await sequelize.query(query, {
        replacements: [otp, mobile, sysdate],
        type: QueryTypes.INSERT,
      });
      return true;
    } else return false;
  } catch (error) {
    throw error;
  }
};

const sendSMS = async (mobile, msg) => {
  // Define the JSON object you want to send
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
