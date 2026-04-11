const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

exports.validateOTP = async (parameter) => {
  //let t = await sequelize.transaction();

  try {
    let query =
      "select OTP, O_ID FROM TB_OTP where MOBILE = ? order by O_ID desc limit 1";
    let results = await sequelize.query(query, {
      replacements: [parameter.mobile],
      type: QueryTypes.SELECT,
    });

    if (results.length != 0) {
      let storedOTP = results?.[0]?.OTP;
      let otpID = results?.[0]?.O_ID;

      console.log("results " + results);
      console.log("Stored OTP - " + storedOTP);
      console.log("User OTP - " + parameter.otp);
      if (parameter.otp == storedOTP) {
        let delQuery = "delete from TB_OTP WHERE O_ID = ?";
        const results = await sequelize.query(delQuery, {
          replacements: [otpID],
          type: QueryTypes.DELETE,
          raw: true,
        });
        return true;
      }
    } else return false;
  } catch (error) {
    throw error;
  }
};

exports.checkExist = async (parameter) => {
  // let t = await sequelize.transaction();
  try {
    let query = "select * FROM TB_USER where U_MOBILE = ? and U_TYPE = ?";
    let result = await sequelize.query(query, {
      replacements: [parameter.mobile, parameter.type],
      type: QueryTypes.SELECT,
    });
    return result;
  } catch (error) {
    // await t.rollback();
    throw error;
  }
};
