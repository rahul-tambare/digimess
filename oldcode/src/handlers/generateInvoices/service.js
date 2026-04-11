const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
const sysdate = [formattedDate];

let response = {
  status: "",
  message: "",
};

exports.generateInvoice = async (parameter) => {
  console.log("Inside generateInvoice method");

  try {
    let invoiceID;
    let invResult = await getInvoiceData(parameter.mspID);

    if (invResult?.[0]?.MSPID != null) {
      let orderIDs = `(${invResult?.[0]?.O_IDs})`;

      let result = await insertIntoInvoice(invResult);
      invoiceID = result?.[0];
      console.log("invoiceID# ", invoiceID);

      let updResult = await updateInvoiceToTBORDER(invoiceID, orderIDs);
      if (updResult) {
        response.status = true;
        response.message = `Invoice# ${invoiceID} generated and updated successfully`;
      } else {
        response.status = false;
        response.message = `Invoice# ${invoiceID} generated successfull but failed to update TB_ORDER`;
      }
    } else {
      response.status = false;
      response.message = "No Orders found to generate an Invoice for given MSP";
    }
    console.log("response ", response);
    return response;
  } catch (error) {
    throw error;
  }
};

const getInvoiceData = async (mspID) => {
  console.log("Inside getInvoiceData method");

  let query = `SELECT 
  A.O_MSPID as MSPID,
  ROUND(SUM(A.O_FINAL_AMOUNT), 2) AS TOTAL_AMOUNT,
  ROUND((SUM(A.O_FINAL_AMOUNT)/100 * B.ADMIN_CHG), 2) AS ADMIN_CHG, 
  ROUND((SUM(A.O_FINAL_AMOUNT) - (SUM(A.O_FINAL_AMOUNT)/100 * B.ADMIN_CHG)), 2) AS FINAL_AMOUNT,
  DATE(MIN(A.O_CR_DATE)) AS START_DATE,
  DATE(MAX(A.O_CR_DATE)) AS END_DATE,
  (SELECT GROUP_CONCAT(O_ID ORDER BY O_ID) FROM TB_ORDER WHERE O_MSPID = A.O_MSPID AND O_INVOICE IS NULL) AS O_IDs
FROM 
  TB_ORDER A
JOIN 
  TB_ADMIN_CHG B ON A.O_MSPID = B.MSPID
WHERE 
  B.STATUS = 1 AND A.O_MSPID = ? AND A.O_STATUS = "CONFIRMED" AND A.O_INVOICE IS NULL;`;

  let results = await sequelize.query(query, {
    replacements: [mspID],
    type: QueryTypes.SELECT,
  });

  return results;
};

const updateInvoiceToTBORDER = async (invoice, orderIDs) => {
  console.log("Inside updateInvoiceToTBORDER method");

  let query = `update TB_ORDER SET O_INVOICE = ? , O_UPD_DT = ? WHERE O_ID IN ${orderIDs}`;
  let results = await sequelize.query(query, {
    replacements: [invoice, sysdate],
    type: QueryTypes.UPDATE,
  });

  console.log("Update Result# ", results);

  if (results[1] >= 1) {
    return true;
  } else return false;
};

const insertIntoInvoice = async (insertData) => {
  console.log("Inside insertIntoInvoice method");

  let status = "GENERATED";

  let query = `INSERT INTO TB_INVOICE (I_MSPID, I_GEN_DT, I_AMOUNT, I_ADMIN_CHG, I_FINAL_AMNT, I_STATUS, I_STRT_DT, I_END_DT)
    VALUES (?,?,?,?,?,?,?,?);`;
  let results = await sequelize.query(query, {
    replacements: [
      insertData?.[0]?.MSPID,
      sysdate,
      insertData?.[0]?.TOTAL_AMOUNT,
      insertData?.[0]?.ADMIN_CHG,
      insertData?.[0]?.FINAL_AMOUNT,
      status,
      insertData?.[0]?.START_DATE,
      insertData?.[0]?.END_DATE,
    ],
    type: QueryTypes.INSERT,
  });

  return results;
};
