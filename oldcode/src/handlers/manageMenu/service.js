const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

const currentDate = new Date();
const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
const sysdate = [formattedDate];

exports.manageMenu = async (parameter) => {
  console.log("Inside manageMenuDetails method");
  console.log("reqtype ### " + parameter.reqtype);
  try {
    let response = {
      result: false,
      msg: "",
    };
    if (parameter.reqtype == "u") {
      let result = await updateMenu(parameter);
      (response.result = true), (response.msg = "updated successfully");
      response.msg = result;
    } else if (parameter.reqtype == "g") {
      let result = await getmenu(parameter);
      (response.result = true), (response.msg = result);
    } else if (parameter.reqtype == "s") {
      let result = await insertmenu(parameter);
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

const getmenu = async (parameter) => {
  console.log("Inside getmanagemenu method");
  try {
    // Updated to include M_IMAGE_URL
    let query = `SELECT 
            A.M_ID,
            B.MSP_NAME,
            A.M_TITLE,
            A.M_TYPE,
            A.M_QNTY,
            A.M_PRICE,
            A.M_TAKEAWAY_CHG,
            A.M_STATUS,
            A.M_CR_DATE,
            A.M_IMAGE_URL,
            GROUP_CONCAT(' ', D.MI_NAME, '-', C.MD_QTY, ' (', C.MD_TAG,') ') AS M_ITEMS
        FROM
            TB_MENU A
        JOIN
            TB_MSP B ON B.MSP_ID = A.M_MSPID 
        JOIN 
            TB_MENU_DETAILS C ON A.M_ID = C.MD_MENUID 
        LEFT JOIN 
            TB_MENU_ITEM D ON D.MI_ID = C.MD_ITMID
        WHERE 
           (A.M_STATUS = 0 OR A.M_STATUS = 1)
        GROUP BY 
            A.M_ID, B.MSP_NAME, A.M_TITLE, A.M_TYPE, A.M_QNTY, 
            A.M_PRICE, A.M_TAKEAWAY_CHG, A.M_STATUS, A.M_CR_DATE, A.M_IMAGE_URL
        ORDER BY 
            A.M_STATUS DESC ;
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

const updateMenu = async (parameter) => {
  try {
    console.log("Inside updateMenuDetails method");
    console.log("menuID = ", parameter.id);
    console.log("imageUrl = ", parameter.imageUrl);

    // Updated to include M_IMAGE_URL
    let query = `UPDATE TB_MENU 
        SET
            M_TITLE = ?,
            M_TYPE = ?,
            M_QNTY = ?,
            M_PRICE = ?,
            M_TAKEAWAY_CHG = ?,
            M_STATUS = ?,
            M_CR_DATE = ?,
            M_IMAGE_URL = ?
        WHERE
            M_ID = ?;
        `;
    let result = await sequelize.query(query, {
      replacements: [
        parameter.menuname,
        parameter.menutype,
        parameter.quantity,
        parameter.price,
        parameter.takeaway,
        parameter.status,
        sysdate,
        parameter.imageUrl, // Added the image URL
        parameter.id,
      ],
      type: QueryTypes.UPDATE,
    });
    console.log(query);

    return result;
  } catch (error) {
    throw error;
  }
};

// Insert menu function
const insertmenu = async (parameter) => {
  try {
    console.log("Inside insertmenu method");

    // Insert query with M_IMAGE_URL
    let query = `INSERT INTO TB_MENU (
            M_MSPID,
            M_TITLE,
            M_TYPE,
            M_QNTY,
            M_PRICE,
            M_TAKEAWAY_CHG,
            M_STATUS,
            M_CR_DATE,
            M_IMAGE_URL
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;

    let result = await sequelize.query(query, {
      replacements: [
        parameter.mspid || 1, // Default MSPID if not provided
        parameter.menuname,
        parameter.menutype,
        parameter.quantity,
        parameter.price,
        parameter.takeaway,
        parameter.status,
        sysdate,
        parameter.imageUrl, // Added the image URL
      ],
      type: QueryTypes.INSERT,
    });

    return result;
  } catch (error) {
    throw error;
  }
};
