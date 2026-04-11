const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

exports.deleteAccount = async (parameter) => {
  try {
    let query = `UPDATE TB_USER
      SET U_STATUS = ?
      WHERE U_USERID = ?;`;
    let result = await sequelize.query(query, {
      replacements: [parameter.status, parameter.userid],
      type: QueryTypes.UPDATE,
    });

    if (result[1] == 1) {
      return true;
    } else return false;
  } catch (error) {
    throw error;
  }
};
