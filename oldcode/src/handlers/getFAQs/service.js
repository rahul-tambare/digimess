const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

exports.getFAQs = async (parameter) => {
  // let t = await sequelize.transaction();

  try {
    let query = "select F_QUESTION, F_ANSWER from TB_FAQS where F_STATUS = 1;";
    let result = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return result;
  } catch (error) {
    throw error;
  }
};
