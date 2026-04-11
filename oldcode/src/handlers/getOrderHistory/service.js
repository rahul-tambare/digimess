const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
const sysdate = [formattedDate];

exports.getOrderHistory = async (parameter) => {
  console.log("Inside getOrderHistory method");

  //let t = await sequelize.transaction();
  try {
    if (parameter.type == "user") {
      let result = await userOrderDetails(parameter);
      return result;
    } else if (parameter.type == "msp") {
      let result = await this.mspOrderDetails(parameter);
      return result;
    } else {
      return false;
    }
  } catch (error) {
    throw error;
  }
};

const userOrderDetails = async (parameter) => {
  console.log("Inside userOrderhistory method");

  //let t = await sequelize.transaction();
  let query = `SELECT A.O_ID,A.O_CR_DATE,A.O_TYPE, C.MSP_NAME, A.O_DISC, A.O_DISC_TYPE, A.O_TAKEWAY_CHG, A.O_DEL_CHG, A.O_FINAL_AMOUNT,A.O_STATUS, B.OD_MENUITEMS,A.O_Address
  FROM TB_ORDER A
  JOIN TB_ORDER_DETAILS B ON A.O_ID = B.OD_OID
  JOIN TB_MSP C ON A.O_MSPID = C.MSP_ID
  WHERE A.O_USERID = ? AND A.O_CR_DATE like ? order by  A.O_ID desc`;
  let results = await sequelize.query(query, {
    replacements: [parameter.userID, `${parameter.date}%`],
    type: QueryTypes.SELECT,
  });

  return results;
};

exports.mspOrderDetails = async (parameter) => {
  console.log("Inside mspOrderHistory method");

  //let t = await sequelize.transaction();
  let query = `SELECT
  A.O_ID,
  A.O_USERID as UID,
  U.U_FNAME,
  U.U_LNAME,
  A.O_DISC,
  A.O_Address,
  A.O_TYPE,
  A.O_DISC_TYPE,
  A.O_TAKEWAY_CHG,
  A.O_DEL_CHG,
  A.O_FINAL_AMOUNT,
  A.O_STATUS,
  A.O_CR_DATE,
  A.O_Notes,
  GROUP_CONCAT(B.OD_MENUITEMS SEPARATOR ', ') AS OD_MENUITEMS,
  B.OD_Price,
  B.OD_QTY
FROM
  TB_ORDER A
JOIN
  TB_ORDER_DETAILS B ON A.O_ID = B.OD_OID
JOIN
  TB_MSP C ON A.O_MSPID = C.MSP_ID
JOIN
  TB_USER U ON A.O_USERID = U.U_USERID
WHERE
  C.MSP_ID = ? AND A.O_CR_DATE LIKE ?
GROUP BY
  A.O_ID,A.O_TYPE,A.O_Notes,B.OD_Price,B.OD_QTY,A.O_CR_DATE, U.U_FNAME, U.U_LNAME,UID,A.O_Address, A.O_DISC, A.O_DISC_TYPE, A.O_TAKEWAY_CHG, A.O_DEL_CHG, A.O_FINAL_AMOUNT order by  A.O_ID desc;`;
  let results = await sequelize.query(query, {
    replacements: [parameter.mspID, `${parameter.date}%`],
    type: QueryTypes.SELECT,
  });

  return results;
};
