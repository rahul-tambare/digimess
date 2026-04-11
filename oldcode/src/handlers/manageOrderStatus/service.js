const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
const sysdate = [formattedDate];

exports.manageOrderStatus = async (parameter) => {
  console.log("Inside manageOrderStatus method");
  try {
    if (parameter.status == "REJECTED") {
      let res = await updateOrderStatus(parameter);

      if (res) {
        return await refundBalance(parameter);
      } else {
        return false;
      }
    } else {
      let res = await updateOrderStatus(parameter);

      if (res) {
        return true;
      } else return false;
    }
  } catch (error) {
    throw error;
  }
};

const updateOrderStatus = async (parameter) => {
  try {
    console.log("Inside updateOrderStatus method");
    let query = `UPDATE TB_ORDER SET O_STATUS = ? , O_UPD_DT = ? WHERE O_ID = ?`;
    let results = await sequelize.query(query, {
      replacements: [parameter.status, sysdate, parameter.orderID],
      type: QueryTypes.UPDATE,
    });

    console.log("result - ", results?.[1]);

    if (results?.[1] == 1) {
      return true;
    } else return false;
  } catch (error) {
    throw error;
  }
};

const refundBalance = async (parameter) => {
  try {
    console.log("Inside refundBalance method");
    let query = `select * from TB_CONS_TRANSACTION WHERE TR_SRC_ID = ? `;
    let result = await sequelize.query(query, {
      replacements: [parameter.orderID],
      type: QueryTypes.SELECT,
    });
    console.log("result =", result);
    let userID = result?.[0]?.TR_USERID;
    let srcID = `${parameter.orderID}-REF`;
    //let credit =  result?.[0]?.TR_CREDIT;
    let debit = result?.[0]?.TR_DEBIT;
    let balance = result?.[0]?.TR_BAL + debit;

    console.log(
      `userID = ${userID}, srcID = ${srcID}, debit = ${debit}, balance = ${balance}`
    );
    query =
      " INSERT INTO TB_CONS_TRANSACTION (TR_USERID, TR_SRC_ID, TR_CREDIT, TR_DEBIT,TR_BAL, TR_CR_DATE) VALUES (?,?,?,?,?,?)";
    let insertResult = await sequelize.query(query, {
      replacements: [userID, srcID, debit, 0, balance, sysdate],
      type: QueryTypes.INSERT,
    });

    console.log(query);

    if (insertResult[1] == 1) {
      return true;
    } else return false;
  } catch (error) {
    throw error;
  }
};
