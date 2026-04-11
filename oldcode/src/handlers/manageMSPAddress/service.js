const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");
const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");

exports.manageMSPAddress = async (parameter) => {
  console.log("Inside manageconsDetails method");
  console.log("reqtype ### " + parameter.reqtype);
  try {
    let response = {
      result: false,
      msg: "",
    };
    if (parameter.reqtype == "s") {
      let result = await insertAddress(parameter);
      (response.result = true), (response.msg = "address inserted succesfully");
    } else if (parameter.reqtype == "u") {
      let result = await updateAddress(parameter);
      (response.result = true), (response.msg = "address updated succesfully");
    } else if (parameter.reqtype == "g") {
      let result = await getMSPAddress(parameter);
      (response.result = true), (response.msg = result);
    } else if (parameter.reqtype == "d") {
      let result = await deleteAddress(parameter);
      (response.result = true), (response.msg = "address deleted succesfully");
    } else {
      return false;
    }
    return response;
  } catch (error) {
    throw error;
  }
};

const insertAddress = async (parameter) => {
  console.log("Inside insertAddress");
  const sysdate = [formattedDate];

  try {
    let query =
      "insert into TB_MSP_ADDRESS (AD_USERID, AD_LINE1, AD_LINE2, AD_CITY, AD_STATE, AD_PIN, AD_REG_DATE, AD_LAT, AD_LON) values (?,?,?,?,?,?,?,?,?)";
    let result = await sequelize.query(query, {
      replacements: [
        parameter.userID,
        parameter.line1,
        parameter.line2,
        parameter.city,
        parameter.state,
        parameter.pincode,
        sysdate,
        parameter.latitude,
        parameter.longitude,
      ],
      type: QueryTypes.INSERT,
    });

    return result;
  } catch (error) {
    throw error;
  }
};

const updateAddress = async (parameter) => {
  console.log("Inside updateAddress method");
  const sysdate = [formattedDate];

  try {
    let query = `update TB_MSP_ADDRESS set AD_USERID = ?, AD_LINE1  = ?, AD_LINE2  = ?, AD_CITY = ?, AD_STATE = ?, AD_PIN = ?, AD_LAT = ?, AD_LON = ?, AD_UPD_DATE =? 
      where AD_ID = ?`;
    let result = await sequelize.query(query, {
      replacements: [
        parameter.userID,
        parameter.line1,
        parameter.line2,
        parameter.city,
        parameter.state,
        parameter.pincode,
        parameter.latitude,
        parameter.longitude,
        sysdate,
        parameter.addID,
      ],
      type: QueryTypes.UPDATE,
    });

    return result;
  } catch (error) {
    throw error;
  }
};

const getMSPAddress = async (parameter) => {
  console.log("Inside getConsAddress method");

  try {
    let query =
      "select AD_ID, AD_LINE1, AD_LINE2, AD_CITY, AD_STATE, AD_PIN, AD_REG_DATE, AD_LAT, AD_LON FROM TB_MSP_ADDRESS where AD_USERID = ?";
    let results = await sequelize.query(query, {
      replacements: [parameter.userID],
      type: QueryTypes.SELECT,
    });
    console.log("get result # ", results);
    console.log("get result[0] ", results[0]);
    console.log("get result[0] ", results[1]);
    return results;
  } catch (error) {
    throw error;
  }
};

const deleteAddress = async (parameter) => {
  console.log("Inside deleteAddress method");
  console.log("userID ", parameter.userID);
  console.log("addressID ", parameter.addID);
  console.log("parameter ", parameter);

  try {
    let query = "DELETE FROM TB_MSP_ADDRESS WHERE AD_USERID = ? and AD_ID = ? ";
    let results = await sequelize.query(query, {
      replacements: [parameter.userID, parameter.addID],
      type: QueryTypes.DELETE,
    });

    return results;
  } catch (error) {
    throw error;
  }
};
