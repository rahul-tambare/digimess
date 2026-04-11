const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

exports.getEnrolledPackages = async (parameter) => {
  let finalRes = {
    FNAME: "",
    LNAME: "",
    EMAIL: "",
    DOB: "",
    GENDER: "",
    MOBILE: "",
    PK_NAME: "",
    PK_ID: "",
    PK_PRICE: "",
    PK_DISC: "",
    PK_VALIDITY: "",
    PK_MSP_CATEGORY: "",
    PK_NO_MSP: "",
    SP_SUB_DATE: "",
    EXPIRY_DT: "",
    TR_BAL: "",
  };

  // let t = await sequelize.transaction();

  try {
    let query = `SELECT 
      A.PK_NAME,
      A.PK_ID,
      A.PK_PRICE,
      A.PK_DISC,
      A.PK_VALIDITY,
      A.PK_NO_MSP,
      A.PK_MSP_CATEGORY,
      B.SP_SUB_DATE,
      (DATE_ADD(B.SP_SUB_DATE,
          INTERVAL A.PK_VALIDITY DAY)) AS EXPIRY_DT
  FROM
      TB_PACKAGES A
          JOIN
      TB_SUBS_PKG B ON B.SP_PKGID = A.PK_ID
         WHERE
      A.PK_STATUS = '1'
          AND (DATE_ADD(B.SP_SUB_DATE,
          INTERVAL A.PK_VALIDITY DAY)) > NOW()
          AND B.SP_USRID = ?; `;
    let results = await sequelize.query(query, {
      replacements: [parameter.userID],
      type: QueryTypes.SELECT,
    });

    let resBal = await getConsumerBalance(parameter.userID);

    (finalRes.PK_NAME = results[0]?.PK_NAME),
      (finalRes.PK_ID = results[0]?.PK_ID),
      (finalRes.PK_PRICE = results[0]?.PK_PRICE),
      (finalRes.PK_DISC = results[0]?.PK_DISC),
      (finalRes.PK_VALIDITY = results[0]?.PK_VALIDITY),
      (finalRes.PK_MSP_CATEGORY = results[0]?.PK_MSP_CATEGORY),
      (finalRes.PK_NO_MSP = results[0]?.PK_NO_MSP),
      (finalRes.SP_SUB_DATE = results[0]?.SP_SUB_DATE),
      (finalRes.EXPIRY_DT = results[0]?.EXPIRY_DT);
    finalRes.FNAME = resBal[0]?.U_FNAME;
    finalRes.LNAME = resBal[0]?.U_LNAME;
    finalRes.EMAIL = resBal[0]?.U_EMAIL;
    finalRes.DOB = resBal[0]?.U_DOB;
    finalRes.GENDER = resBal[0]?.U_GENDER;
    finalRes.MOBILE = resBal[0]?.U_MOBILE;
    finalRes.TR_BAL = resBal[0]?.TR_BAL || 0;

    console.log("results =", finalRes);
    return finalRes;
  } catch (error) {
    throw error;
  }
};

const getConsumerBalance = async (userID) => {
  try {
    console.log("Inside getConsumerBalance method");
    let query = `SELECT 
    B.U_FNAME, B.U_LNAME, B.U_EMAIL, B.U_MOBILE, B.U_GENDER, B.U_DOB, A.TR_BAL
FROM
    TB_USER B
LEFT JOIN
    TB_CONS_TRANSACTION A ON A.TR_USERID = B.U_USERID 
WHERE
    B.U_USERID = ?
ORDER BY
    A.TR_ID DESC
LIMIT 1;`;
    let result = await sequelize.query(query, {
      replacements: [userID],
      type: QueryTypes.SELECT,
    });

    console.log(query);

    return result;
  } catch (error) {
    throw error;
  }
};
