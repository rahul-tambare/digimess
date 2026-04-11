const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
const sysdate = [formattedDate];

exports.manageTodaysOrders = async (parameter) => {
  console.log("Inside manageTodaysOrders method");
  console.log("reqtype ### " + parameter.reqtype);
  try {
    let response = {
      result: false,
      msg: "",
    };
    if (parameter.reqtype == "c") {
      let result = await getConfirmOrders(parameter);
      (response.result = true), (response.msg = "updated succesfully");
      response.msg = result;
    } else if (parameter.reqtype == "p") {
      let result = await getPendingOrders(parameter);
      (response.result = true), (response.msg = result);
    } else if (parameter.reqtype == "r") {
      let result = await getRejectedOrders(parameter);
      response.result = true;
      response.msg = result;
    } else {
      return false;
    }
    return response;
  } catch (error) {
    throw error;
  }
};

const getPendingOrders = async (parameter) => {
  console.log("Inside manageTodaysOrders method");
  try {
    //let t = await sequelize.transaction();
    let query = `SELECT 
            A.O_ID, concat(B.U_FNAME, ' ', U_LNAME) AS O_USERID, 
            C.MSP_NAME,A.O_FINAL_AMOUNT, A.O_CR_DATE, A.O_STATUS
            FROM TB_ORDER A
            JOIN
            TB_USER B ON A.O_USERID = B.U_USERID
            JOIN 
            TB_MSP C on A.O_MSPID = C.MSP_ID
            WHERE O_STATUS='pending' 
            AND DATE(O_CR_DATE) = CURDATE();                      
            `;
    let result = await sequelize.query(query, {
      replacements: [parameter],
      type: QueryTypes.SELECT,
    });
    console.log(query);

    return result;
  } catch (error) {
    throw error;
  }
};

const getConfirmOrders = async (parameter) => {
  console.log("Inside manageTodaysOrders method");
  try {
    //let t = await sequelize.transaction();
    let query = `SELECT 
            A.O_ID, concat(B.U_FNAME, ' ', U_LNAME) AS O_USERID, 
            C.MSP_NAME,A.O_FINAL_AMOUNT, A.O_CR_DATE, A.O_STATUS
            FROM TB_ORDER A
            JOIN
            TB_USER B ON A.O_USERID = B.U_USERID
            JOIN 
            TB_MSP C on A.O_MSPID = C.MSP_ID
            WHERE O_STATUS='confirmed' 
            AND DATE(O_CR_DATE) = CURDATE();
            `;
    let result = await sequelize.query(query, {
      replacements: [parameter],
      type: QueryTypes.SELECT,
    });
    console.log(query);

    return result;
  } catch (error) {
    throw error;
  }
};

const getRejectedOrders = async (parameter) => {
  console.log("Inside manageTodaysOrders method");
  try {
    //let t = await sequelize.transaction();
    let query = `SELECT 
            A.O_ID, concat(B.U_FNAME, ' ', U_LNAME) AS O_USERID, 
            C.MSP_NAME,A.O_FINAL_AMOUNT, A.O_CR_DATE, A.O_STATUS
            FROM TB_ORDER A
            JOIN
            TB_USER B ON A.O_USERID = B.U_USERID
            JOIN 
            TB_MSP C on A.O_MSPID = C.MSP_ID
            WHERE O_STATUS='rejected' 
            AND DATE(O_CR_DATE) = CURDATE();            
            `;
    let result = await sequelize.query(query, {
      replacements: [parameter],
      type: QueryTypes.SELECT,
    });
    console.log(query);

    return result;
  } catch (error) {
    throw error;
  }
};
