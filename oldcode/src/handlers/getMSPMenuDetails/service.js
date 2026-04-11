const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

exports.getMSPMenuDetails = async (parameter) => {
  try {
    //let t = await sequelize.transaction();
    let query = "";
    if (parameter.type == 1) {
      query = `SELECT A.M_MSPID, A.M_ID, B.MD_ID,A.M_IMAGE_URL, A.M_TITLE, A.M_TYPE, A.M_STATUS, A.M_CAT, A.M_PRICE, A.M_QNTY,
     A.M_TAKEAWAY_CHG, A.M_NOTES, GROUP_CONCAT(' ', C.MI_NAME, '-', B.MD_QTY, ' (', B.MD_TAG,') ') AS M_ITEMS 
    FROM TB_MENU A JOIN TB_MENU_DETAILS B ON A.M_ID = B.MD_MENUID 
    LEFT JOIN TB_MENU_ITEM C ON C.MI_ID = B.MD_ITMID
    WHERE A.M_MSPID = ? AND (A.M_STATUS = 0 OR A.M_STATUS = 1) GROUP BY A.M_ID; `;
    } else {
      query = `SELECT A.M_MSPID, A.M_ID, B.MD_ID, A.M_TITLE,A.M_IMAGE_URL, A.M_TYPE, A.M_STATUS, A.M_CAT, A.M_PRICE, A.M_QNTY,
      A.M_TAKEAWAY_CHG, A.M_NOTES, GROUP_CONCAT(' ', C.MI_NAME, '-', B.MD_QTY, ' (', B.MD_TAG,') ') AS M_ITEMS 
     FROM TB_MENU A JOIN TB_MENU_DETAILS B ON A.M_ID = B.MD_MENUID 
     LEFT JOIN TB_MENU_ITEM C ON C.MI_ID = B.MD_ITMID
     WHERE A.M_MSPID = ? AND A.M_STATUS = 1 GROUP BY A.M_ID;`;
    }
    let results = await sequelize.query(query, {
      replacements: [parameter.mspID],
      type: QueryTypes.SELECT,
    });

    return results;
  } catch (error) {
    throw error;
  }
};
