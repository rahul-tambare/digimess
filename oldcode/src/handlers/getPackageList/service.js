const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

exports.getPackages = async (parameter) => {
  // let t = await sequelize.transaction();

  try {
    let query = "select * FROM TB_PACKAGES where PK_CITY = ? and PK_STATUS = 1";
    let results = await sequelize.query(query, {
      replacements: [parameter.usrCity],
      type: QueryTypes.SELECT,
    });

    return results;
  } catch (error) {
    throw error;
  }
};
