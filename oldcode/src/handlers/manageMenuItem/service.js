const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
const sysdate = [formattedDate];

exports.manageMenuDetails = async (parameter) => {
  console.log("Inside manageMenuDetails method");
  console.log("reqtype ### " + parameter.reqtype);
  try {
    let response = {
      result: false,
      msg: "",
    };
    if (parameter.reqtype == "u") {
      let result = await updateMenuDetails(parameter);
      (response.result = true), (response.msg = "updated succesfully");
      response.msg = result;
    } else if (parameter.reqtype == "g") {
      let result = await getmanagemenu(parameter);
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

const getmanagemenu = async (parameter) => {
  console.log("Inside getmanagemenu method");
  try {
    //let t = await sequelize.transaction();
    let query = `SELECT  
            A.MI_ID,
            B.MC_NAME,
            A.MI_NAME,
            A.MI_TYPE
        FROM
            TB_MENU_ITEM A
        JOIN
            TB_MENU_CATEGORY B ON B.MC_ID = A.MI_MCID;`;
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

const updateMenuDetails = async (parameter) => {
  try {
    console.log("Inside updateMenuDetails method");
    console.log("packageID = ", parameter.packageId);
    console.log("status = ", parameter.status);
    let query = ` update TB_MENU_ITEM set 
        MI_NAME = ?,
        MI_TYPE = ? 
        WHERE MI_ID = ?
        `;
    let result = await sequelize.query(query, {
      replacements: [parameter.itemname, parameter.itemtype, parameter.id],
      type: QueryTypes.UPDATE,
    });
    console.log(query);

    return result;
  } catch (error) {
    throw error;
  }
};

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
