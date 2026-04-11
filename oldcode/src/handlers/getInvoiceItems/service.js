const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
const sysdate = [formattedDate];

exports.getInvoiceDetails = async (parameter) => {
  console.log("Inside getInvoiceDetails method");

  try {
    let response = {
      stats: {},
      list: [{}],
    };

    let query = `select I_STATUS AS STATUS, SUM(I_FINAL_AMNT) AS AMOUNT from TB_INVOICE WHERE I_MSPID = ? GROUP BY I_STATUS`;
    let results = await sequelize.query(query, {
      replacements: [parameter.mspID],
      type: QueryTypes.SELECT,
    });
    response.stats = results;

    console.log("query result stats ", results);

    query = `SELECT I_INVID, I_MSPID, I_GEN_DT, I_AMOUNT, I_ADMIN_CHG, I_FINAL_AMNT, I_STATUS, I_STRT_DT, I_END_DT FROM TB_INVOICE where I_MSPID = ?;`;
    results = await sequelize.query(query, {
      replacements: [parameter.mspID],
      type: QueryTypes.SELECT,
    });
    console.log("query result list ", results);
    response.list = results;
    console.log("final response ", response);
    return response;
  } catch (error) {
    throw error;
  }
};
