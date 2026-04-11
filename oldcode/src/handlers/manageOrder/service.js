const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

exports.manageOrders = async (parameter) => {
  try {
    console.log("Inside getmanageOrder method");

    //let t = await sequelize.transaction();
    let query = `SELECT 
        ROW_NUMBER() OVER (ORDER BY A.O_ID DESC) AS SERIAL_NUMBER,
        CONCAT(B.U_FNAME, ' ', B.U_LNAME) AS U_FULLNAME,
        C.MSP_NAME,
        A.O_FINAL_AMOUNT,
        A.O_CR_DATE
    FROM
        TB_ORDER A
    JOIN
        TB_USER B ON B.U_USERID = A.O_USERID
    JOIN
        TB_MSP C ON C.MSP_ID = A.O_MSPID
    ORDER BY A.O_ID DESC;  
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
