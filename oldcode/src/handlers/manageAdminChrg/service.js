const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
const sysdate = [formattedDate];

exports.manageAdminChrg = async (parameter) => {
  console.log("Inside manageAdminChrg method");
  console.log("reqtype ### " + parameter.reqtype);
  try {
    let response = {
      result: false,
      msg: "",
    };
    if (parameter.reqtype == "u") {
      let result = await updateAdminChrg(parameter);
      (response.result = true), (response.msg = "updated succesfully");
      response.msg = result;
    } else if (parameter.reqtype == "g") {
      let result = await getAdminList(parameter);
      (response.result = true), (response.msg = result);
    } else {
      return false;
    }
    return response;
  } catch (error) {
    throw error;
  }
};

const getAdminList = async (parameter) => {
  console.log("Inside getAdminList method");
  try {
    //let t = await sequelize.transaction();
    let query = `SELECT 
            A.ID,
            A.MSPID,
            B.MSP_NAME,
            A.ADMIN_CHG,
            A.STATUS,
            A.CR_DATE
            FROM TB_ADMIN_CHG A
            LEFT JOIN
            TB_MSP B ON A.MSPID = B.MSP_ID;
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

const updateAdminChrg = async (parameter) => {
  try {
    console.log("Inside updateAdminChrg method");
    console.log("mspID = ", parameter.mspid);
    // console.log("status = ", parameter.status);
    let query = `UPDATE TB_ADMIN_CHG SET ADMIN_CHG = ?, STATUS = ? WHERE MSPID = ?;
        `;
    let result = await sequelize.query(query, {
      replacements: [parameter.admincharge, parameter.status, parameter.mspid],
      type: QueryTypes.UPDATE,
    });
    console.log(query);

    return result;
  } catch (error) {
    throw error;
  }
};
