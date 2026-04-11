const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

exports.getInvoice = async (parameter) => {
  // let t = await sequelize.transaction();

  try {
    let query = `SELECT I_INVID, I_MSPID, I_GEN_DT, I_AMOUNT, I_ADMIN_CHG, I_FINAL_AMNT, I_STATUS, I_STRT_DT, I_END_DT FROM TB_INVOICE;`;
    let results = await sequelize.query(query, {
      replacements: [parameter],
      type: QueryTypes.SELECT,
    });

    return results;
  } catch (error) {
    throw error;
  }
};
