const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");
//const sms = require("common-layer/utils/sendSMS");
const { Axios } = require("common-layer/utils/packageExports.js");
const { apiResponse } = require("common-layer/utils/helper.js");

const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
const sysdate = [formattedDate];

exports.manageBankDetails = async (parameter) => {
  console.log("Inside manageBankDetails method");

  //let t = await sequelize.transaction();
  try {
    let response;
    if (parameter.type == "save") {
      let result = await saveBankDetail(parameter);
      return result;
    } else if (parameter.type == "edit") {
      let result = await updateBankDetails(parameter);
      return result;
    } else if (parameter.type == "get") {
      let result = await getBankDetails(parameter);
      return result;
    } else {
      return false;
    }
    console.log("Message - ", response.message);
    return response;
  } catch (error) {
    throw error;
  }
};

const saveBankDetail = async (insertData) => {
  console.log("Inside insertIntoBankDetails method");
  let query = ` INSERT INTO TB_BANKDETAILS ( B_USERID, B_BANKNAME, B_ACCOUNTNUMBER, B_ACCOUNTHOLDERNAME, B_IFSCCODE) 
      VALUES (?,?,?,?,?)`;
  let result = await sequelize.query(query, {
    replacements: [
      insertData.userID,
      insertData.bankName,
      insertData.accountNo,
      insertData.accntName,
      insertData.ifsc,
    ],
    type: QueryTypes.INSERT,
  });
  console.log(query);

  return result;
};

const updateBankDetails = async (insertData) => {
  console.log("Inside updateBankDetails method");
  let query = ` UPDATE TB_BANKDETAILS SET B_BANKNAME = ?, B_ACCOUNTNUMBER = ?, B_ACCOUNTHOLDERNAME=?, 
      B_IFSCCODE =? WHERE B_USERID = ? AND B_ID = ?`;
  let result = await sequelize.query(query, {
    replacements: [
      insertData.bankName,
      insertData.accountNo,
      insertData.accntName,
      insertData.ifsc,
      insertData.userID,
      insertData.bID,
    ],
    type: QueryTypes.UPDATE,
  });
  console.log(query);

  return result;
};

const getBankDetails = async (parameter) => {
  console.log("Inside insertIntoRecharge method");
  let query = `SELECT 
    *
  FROM
    TB_BANKDETAILS
  WHERE
    B_USERID = ?;`;
  let result = await sequelize.query(query, {
    replacements: [parameter.userID],
    type: QueryTypes.SELECT,
  });
  console.log(query);

  return result;
};
