const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");
const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");

exports.editConsumerProfile = async (parameter) => {
  // let t = await sequelize.transaction();
  const sysdate = [formattedDate];

  try {
    let query = `UPDATE TB_USER SET U_FNAME = ?, U_LNAME = ?, U_EMAIL = ?, U_MOBILE =?, U_GENDER = ?, U_DOB = ? WHERE U_USERID = ?;`;
    let result = await sequelize.query(query, {
      replacements: [
        parameter.firstName,
        parameter.lastName,
        parameter.email,
        parameter.mobile,
        parameter.gender,
        parameter.dob,
        parameter.userId,
      ],
      type: QueryTypes.UPDATE,
    });

    if (result[1] == 1) {
      return true;
    } else return false;
  } catch (error) {
    throw error;
  }
};
