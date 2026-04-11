const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
const sysdate = [formattedDate];

exports.manageMessDetails = async (parameter) => {
  console.log("Inside manageMessDetails method");

  try {
    let res = {
      status: false,
      msg: "",
      mspID: "",
    };
    if (parameter.type == "u") {
      let result = await updateMessDetails(parameter);

      if (result[1] == 1) {
        res.status = true;
        res.msg = "Updates successful";

        // result = await insertDocuments(parameter);
        // if (result[1] == 1) {
        //     res.status = true;
        //     res.msg += " , insert successfully."
        // }
      } else {
        res.status = false;
        res.msg = "Updates failed";
      }
    } else if (parameter.type == "s") {
      let result = await insertMessDetails(parameter);

      if (result[1] == 1) {
        res.status = true;
        res.msg = " Insert successful";
        res.mspID = result[0];

        // result = await insertDocuments(parameter);
        // if (result[1] == 1) {
        //     res.status = true;
        //     res.msg += " , insert successfully."
        // }
      } else {
        res.status = false;
        res.msg = "  , insert failed";
      }
      console.log("res+++ ", res);
    } else if (parameter.type == "g") {
      let result = await getMSPSettings(parameter);
      console.log("Get Result", result);
      console.log("result.length ", result.length);
      if (result.length != 0) {
        res.status = true;
        res.msg = result;
      } else {
        res.status = false;
        res.msg = "No results fetched for given MSPID";
      }
    } else {
      res.status = false;
      res.msg = " , insert failed.";
    }

    return res;
  } catch (error) {
    throw error;
  }
};

const insertMessDetails = async (insertData) => {
  console.log("Inside insert mess Details method");

  // Check if the messImageUrl is provided
  const hasImageUrl =
    insertData.messImageUrl && insertData.messImageUrl.trim() !== "";

  let query;
  let replacements;

  if (hasImageUrl) {
    // If messImageUrl is provided, include it in the query
    query = ` INSERT INTO TB_MSP ( MSP_USRID, MSP_NAME, MSP_TYPE, MSP_CAPACITY, MSP_AUTO_CNFM, 
            MSP_DELIVERY, MSP_BUS_STATUS, MSP_LSTRT_HRS, MSP_LEND_HRS, MSP_DSTRT_HRS, MSP_DEND_HRS, 
            MSP_INVC_FREQ, DEL_CHG, MSP_Image) 
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,? )`;
    replacements = [
      insertData.userID,
      insertData.messName,
      insertData.messType,
      insertData.capacity,
      insertData.autoConfirm,
      insertData.delivery,
      insertData.status,
      insertData.l_strtHrs,
      insertData.l_endHrs,
      insertData.d_strtHrs,
      insertData.d_endHrs,
      insertData.invoice,
      insertData.del_chg,
      insertData.messImageUrl,
    ];
  } else {
    // Original query without messImageUrl to maintain backward compatibility
    query = ` INSERT INTO TB_MSP ( MSP_USRID, MSP_NAME, MSP_TYPE, MSP_CAPACITY, MSP_AUTO_CNFM, 
            MSP_DELIVERY, MSP_BUS_STATUS, MSP_LSTRT_HRS, MSP_LEND_HRS, MSP_DSTRT_HRS, MSP_DEND_HRS, 
            MSP_INVC_FREQ, DEL_CHG) 
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,? )`;
    replacements = [
      insertData.userID,
      insertData.messName,
      insertData.messType,
      insertData.capacity,
      insertData.autoConfirm,
      insertData.delivery,
      insertData.status,
      insertData.l_strtHrs,
      insertData.l_endHrs,
      insertData.d_strtHrs,
      insertData.d_endHrs,
      insertData.invoice,
      insertData.del_chg,
    ];
  }

  console.log(query);

  let result = await sequelize.query(query, {
    replacements: replacements,
    type: QueryTypes.INSERT,
  });

  return result;
};

const updateMessDetails = async (insertData) => {
  console.log("Inside updateMessDetails method");

  // Check if the messImageUrl is provided
  const hasImageUrl =
    insertData.messImageUrl && insertData.messImageUrl.trim() !== "";

  let query;
  let replacements;

  if (hasImageUrl) {
    // If messImageUrl is provided, include it in the update
    query = ` UPDATE TB_MSP SET MSP_NAME = ?, MSP_TYPE = ?, MSP_CAPACITY = ?, MSP_AUTO_CNFM = ?,  
        MSP_DELIVERY = ?, MSP_BUS_STATUS = ?, MSP_LSTRT_HRS = ?, MSP_LEND_HRS = ?, MSP_DSTRT_HRS = ?, 
        MSP_DEND_HRS = ?, MSP_INVC_FREQ = ?, DEL_CHG = ?, MSP_Image = ? ,MSP_Image2 = ?, MSP_Image3 = ?  WHERE MSP_ID = ? `;
    replacements = [
      insertData.messName,
      insertData.messType,
      insertData.capacity,
      insertData.autoConfirm,
      insertData.delivery,
      insertData.status,
      insertData.l_strtHrs,
      insertData.l_endHrs,
      insertData.d_strtHrs,
      insertData.d_endHrs,
      insertData.invoice,
      insertData.del_chg,
      insertData.messImageUrl,
      insertData.messImageUrl2,
      insertData.messImageUrl3,
      insertData.mspID,
    ];
  } else {
    // Original update query without messImageUrl to maintain backward compatibility
    query = ` UPDATE TB_MSP SET MSP_NAME = ?, MSP_TYPE = ?, MSP_CAPACITY = ?, MSP_AUTO_CNFM = ?,  
        MSP_DELIVERY = ?, MSP_BUS_STATUS = ?, MSP_LSTRT_HRS = ?, MSP_LEND_HRS = ?, MSP_DSTRT_HRS = ?, 
        MSP_DEND_HRS = ?, MSP_INVC_FREQ = ?, DEL_CHG = ?  WHERE MSP_ID = ? `;
    replacements = [
      insertData.messName,
      insertData.messType,
      insertData.capacity,
      insertData.autoConfirm,
      insertData.delivery,
      insertData.status,
      insertData.l_strtHrs,
      insertData.l_endHrs,
      insertData.d_strtHrs,
      insertData.d_endHrs,
      insertData.invoice,
      insertData.del_chg,
      insertData.mspID,
    ];
  }

  console.log(query);

  let result = await sequelize.query(query, {
    replacements: replacements,
    type: QueryTypes.UPDATE,
  });

  return result;
};

const insertDocuments = async (insertData) => {
  console.log("Inside insert document Details method");
  let query = ` INSERT INTO TB_DOCUMENTS (  DOC_MSPID, DOC_DOCUMNT1, DOC_DOCUMNT2, DOC_DOCUMNT3, DOC_DOCUMNT4) 
      VALUES (?,?,?,?,?)`;
  let result = await sequelize.query(query, {
    replacements: [
      insertData.mspID,
      insertData.document1,
      insertData.document2,
      insertData.document3,
      insertData.document4,
    ],
    type: QueryTypes.INSERT,
  });
  console.log(query);

  return result;
};

const getMSPSettings = async (insertData) => {
  console.log("Inside getMSPSettings method");
  let query = `select * from TB_MSP where MSP_ID = ?`;
  let result = await sequelize.query(query, {
    replacements: [insertData.mspID],
    type: QueryTypes.SELECT,
  });
  console.log(query);

  return result;
};
