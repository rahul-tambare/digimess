const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

exports.managePayment = async (parameter) => {
  try {
    console.log("Inside getmanagePayment method");

    //let t = await sequelize.transaction();
    let query = `SELECT 
        ROW_NUMBER() OVER (ORDER BY A.R_DATE desc) AS SERIAL_NUMBER,
        A.R_DATE,  
        CONCAT(B.U_FNAME, ' ', B.U_LNAME) AS U_FULLNAME,
        A.R_STATUS,
        A.R_AMOUNT,
        A.R_CFID
        FROM
            TB_RECHARGE A
            JOIN
            TB_USER B ON B.U_USERID = A.R_USERID
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
