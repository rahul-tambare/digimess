const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

exports.getConsAddress = async (parameter) => {
  // let t = await sequelize.transaction();

  try {
    let query = "select * FROM TB_ADDRESS where AD_USERID = ?";
    let results = await sequelize.query(query, {
      replacements: [parameter.userID],
      type: QueryTypes.SELECT,
    });

    return results;
  } catch (error) {
    throw error;
  }
};
