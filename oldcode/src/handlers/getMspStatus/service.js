const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

exports.manageMspStatus = async (parameter) => {
  console.log("Inside getMspStatus method");

  try {
    if (parameter.type == 1) {
      let response = await getMspStatus(parameter);
      console.log("Message - ", response.message);
      return response;
    } else {
      let response = await handleMSPStatus(parameter);
      console.log("Message - ", response.message);
      return response;
    }
  } catch (error) {
    throw error;
  }
};

const getMspStatus = async (parameter) => {
  console.log("Inside fetchMspStatus status method");

  let query = `select MSP_APPROVED, MSP_ID, MSP_NAME from TB_MSP where MSP_USRID = ?;`;
  let results = await sequelize.query(query, {
    replacements: [parameter.userID],
    type: QueryTypes.SELECT,
  });

  return results;
};

const handleMSPStatus = async (parameter) => {
  console.log("Inside handleMSPStatus status method");

  let query = `update TB_MSP SET MSP_BUS_STATUS = ? WHERE MSP_ID = ?;;`;
  let results = await sequelize.query(query, {
    replacements: [parameter.status, parameter.mspID],
    type: QueryTypes.UPDATE,
  });

  return results;
};
