const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
const sysdate = [formattedDate];

exports.getMenuItemsList = async (parameter) => {
  console.log("Inside getMenuItemsList method");

  let finalRes = [{}];

  try {
    let query = `SELECT A.MI_ID, A.MI_MCID, B.MC_NAME, A.MI_NAME, A.MI_TYPE FROM TB_MENU_ITEM A , 
    TB_MENU_CATEGORY B WHERE A.MI_MCID = B.MC_ID  ORDER BY A.MI_MCID ASC`;
    let results = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    for (let i = 0; i < results.length; i++) {
      let temp = {
        MI_MCID: "",
        MI_ID: "",
        MI_NAME: "",
        MI_TYPE: "",
        MC_NAME: "",
      };

      temp.MI_ID = results[i]?.MI_ID;
      temp.MI_NAME = results[i]?.MI_NAME;
      temp.MI_MCID = results[i]?.MI_MCID;
      temp.MI_TYPE = results[i]?.MI_TYPE;
      temp.MC_NAME = results[i]?.MC_NAME;
      finalRes[i] = temp;
    }

    console.log("finalRes  ", finalRes);

    return finalRes;
  } catch (error) {
    throw error;
  }
};
