const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
const sysdate = [formattedDate];

exports.manageUserCoin = async (parameter) => {
  console.log("Inside managepackageDetails method");
  console.log("reqtype ### " + parameter.reqtype);
  try {
    let response = {
      result: false,
      msg: "",
    };
    if (parameter.reqtype == "u") {
      let result = await updateMessDetails(parameter);
      (response.result = true), (response.msg = "updated succesfully");
      response.msg = result;
    } else if (parameter.reqtype == "g") {
      let result = await getUserCoinBalance(parameter);
      (response.result = true), (response.msg = result);
    } else if (parameter.reqtype == "s") {
      let result = await insertIntoPackages(parameter);
      response.result = true;
      response.msg = "inserted successfully";
    } else {
      return false;
    }
    return response;
  } catch (error) {
    throw error;
  }
};

const getUserCoinBalance = async (parameter) => {
  console.log("Inside getmanagemess method");
  try {
    //let t = await sequelize.transaction();
    let query = `SELECT 
            A.TR_ID,
                concat(B.U_FNAME,' ', B.U_LNAME) AS FULLNAME,
                 A.TR_BAL, A.TR_SRC_ID, A.TR_CREDIT, A.TR_DEBIT, A.TR_BAL,
                 A.TR_CR_DATE
                FROM TB_CONS_TRANSACTION A 
                JOIN 
                TB_USER B ON A.TR_USERID = B.U_USERID;`;
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

// const updateMessDetails = async (parameter) => {
//     try {
//         console.log("Inside updateMessDetails method");
//         console.log("packageID = ", parameter.packageId);
//         console.log("status = ", parameter.status);
//         let query = ` UPDATE TB_PACKAGES
//         SET
//             PK_NAME = ?,
//             PK_PRICE = ?,
//             PK_DISC = ?,
//             PK_VALIDITY = ?,
//             PK_STATUS = ?,
//             PK_NO_MSP = ?,
//             PK_CR_DATE = ?
//         WHERE PK_ID = ?
//         `;
//         let result = await sequelize.query(query, {
//             replacements: [
//                 parameter.package,
//                 parameter.price,
//                 parameter.discount,
//                 parameter.validity,
//                 parameter.status,
//                 parameter.mspno,
//                 sysdate,
//                 parameter.packageId

//             ],
//             type: QueryTypes.UPDATE,
//         });
//         console.log(query);

//         return result;
//     } catch (error) {
//         throw error;
//     }
// };

// const insertIntoPackages = async (parameter) => {
//     try {
//         console.log("Inside insertIntoPackages method");
//         console.log("packageID = ", parameter.packageId);
//         console.log("status = ", parameter.status);
//         let query = `INSERT INTO TB_PACKAGES (
//             PK_NAME,
//             PK_PRICE,
//             PK_DISC,
//             PK_VALIDITY,
//             PK_STATUS,
//             PK_NO_MSP,
//             PK_CR_DATE,
//             PK_CITY
//         ) VALUES (?,?,?,?,?,?,?,?    );

//         `;
//         let result = await sequelize.query(query, {
//             replacements: [
//                 parameter.package,
//                 parameter.price,
//                 parameter.discount,
//                 parameter.validity,
//                 parameter.status,
//                 parameter.mspno,
//                 sysdate,
//                 parameter.city

//             ],
//             type: QueryTypes.INSERT,
//         });
//         console.log(query);

//         return result;
//     } catch (error) {
//         throw error;
//     }
// };
