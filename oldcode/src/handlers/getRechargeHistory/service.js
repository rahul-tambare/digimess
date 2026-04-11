const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
const sysdate = [formattedDate];

exports.getRechargeDetails = async (parameter) => {
  try {
    //let t = await sequelize.transaction();
    // let query = `SELECT R_AMOUNT,R_DATE, R_STATUS
    // FROM TB_RECHARGE
    // WHERE R_USERID = ? order by R_ID desc `;
    let query = `SELECT 
    DATE_FORMAT(TR_CR_DATE, '%d/%m/%Y %h:%i %p') AS "DATE",
    TR_CREDIT AS "CREDIT",
    TR_DEBIT AS "DEBIT",
    TR_BAL AS "BALANCE",
    CASE 
        WHEN TR_SRC_ID LIKE '%REF' THEN CONCAT('Refund for rejected order. Order ID: ', REPLACE(TR_SRC_ID, '-REF', ''))
        WHEN TR_SRC_ID COLLATE utf8mb4_unicode_ci IN (SELECT CAST(O_ID AS CHAR) COLLATE utf8mb4_unicode_ci FROM TB_ORDER) 
            THEN CONCAT('Order placed. Order ID: ', TR_SRC_ID)
        WHEN TR_SRC_ID COLLATE utf8mb4_unicode_ci IN (SELECT CAST(R_ID AS CHAR) COLLATE utf8mb4_unicode_ci FROM TB_RECHARGE) 
            THEN CONCAT('Recharge done. Recharge ID: ', TR_SRC_ID)
        ELSE 'Unknown Transaction'
    END AS "REMARK"
FROM 
    TB_CONS_TRANSACTION 
WHERE 
    TR_USERID = ? 
ORDER BY 
    TR_ID DESC;
`;
    let results = await sequelize.query(query, {
      replacements: [parameter.userID],
      type: QueryTypes.SELECT,
    });

    return results;
  } catch (error) {
    throw error;
  }
};
