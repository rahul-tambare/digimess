const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

exports.manageMessDetails = async (parameter) => {
  console.log("[manageMessDetails] Called with reqtype:", parameter.reqtype);

  const response = {
    result: false,
    msg: "",
  };

  try {
    switch (parameter.reqtype) {
      case "u":
        console.log("[manageMessDetails] Updating mess details...");
        response.msg = await updateMessDetails(parameter);
        response.result = true;
        break;

      case "g":
        console.log("[manageMessDetails] Getting mess list...");
        response.msg = await getManageMess(parameter);
        response.result = true;
        break;

      case "e":
        console.log("[manageMessDetails] Editing admin charge...");
        response.msg = await editAdminChrg(parameter);
        response.result = true;
        break;

      default:
        console.warn(
          "[manageMessDetails] Invalid request type:",
          parameter.reqtype
        );
        response.msg = "Invalid request type.";
        break;
    }

    return response;
  } catch (error) {
    console.error("[manageMessDetails] Error occurred:", error);
    response.msg = "An error occurred while processing the request.";
    return response;
  }
};

const getManageMess = async (parameter) => {
  console.log("[getManageMess] Fetching mess data...");

  const query = `
  WITH BankDetails AS (
    SELECT 
        B.*,
        ROW_NUMBER() OVER (PARTITION BY B.B_USERID ORDER BY B.B_ID DESC) AS rn
    FROM TB_BANKDETAILS B
  ),
  MspAddress AS (
      SELECT 
          C.*,
          ROW_NUMBER() OVER (PARTITION BY C.AD_USERID ORDER BY C.AD_ID DESC) AS rn
      FROM TB_MSP_ADDRESS C
  ),
  MinPrices AS (
      SELECT
          M_MSPID,
          MIN(M_PRICE) AS MIN_M_PRICE
      FROM TB_MENU
      GROUP BY M_MSPID
  )
  SELECT 
      ROW_NUMBER() OVER (ORDER BY M.MSP_ID desc) AS SERIAL_NUMBER,
      CONCAT(U.U_FNAME, ' ', U.U_LNAME) AS U_FULL_NAME,
      M.MSP_NAME,
      U.U_MOBILE,
      M.MSP_APPROVED,   
      C.AD_LINE1,
      U.U_USERID, U.U_EMAIL, U.U_DATE, U.U_TYPE, U.U_GENDER, U.U_DOB, M.MSP_ID,
      M.MSP_TYPE, M.MSP_CAPACITY, M.MSP_AUTO_CNFM, M.MSP_DELIVERY, M.DINE_IN, M.TAKE_AWAY, M.MSP_Image, M.MSP_Image2, M.MSP_Image3,
      M.MSP_BUS_STATUS, M.MSP_LSTRT_HRS, M.MSP_LEND_HRS, M.MSP_DSTRT_HRS, M.MSP_DEND_HRS, M.MSP_INVC_FREQ,
      M.DEL_CHG, M.MSP_APPROVED, B.B_ID, B.B_BANKNAME, B.B_ACCOUNTNUMBER, B.B_ACCOUNTHOLDERNAME, B.B_IFSCCODE,
      AC.ADMIN_CHG, M.MSP_CATEGORY, AC.STATUS, M.MSP_RATING, M.Offer_1, M.Offer_2, M.Offer_3, M.cuisines,
      MP.MIN_M_PRICE
  FROM 
      TB_MSP M
  LEFT JOIN 
      TB_USER U ON M.MSP_USRID = U.U_USERID
  LEFT JOIN 
      BankDetails B ON M.MSP_USRID = B.B_USERID AND B.rn = 1
  LEFT JOIN 
      MspAddress C ON M.MSP_USRID = C.AD_USERID AND C.rn = 1
  LEFT JOIN 
      TB_ADMIN_CHG AC ON M.MSP_ID = AC.MSPID
  LEFT JOIN
      MinPrices MP ON M.MSP_ID = MP.M_MSPID`;

  try {
    const result = await sequelize.query(query, {
      replacements: [
        parameter.messName,
        parameter.reqtype,
        parameter.status,
        parameter.mspId,
        parameter.category,
      ],
      type: QueryTypes.SELECT,
    });

    console.log("[getManageMess] Retrieved", result.length, "rows.");
    return result;
  } catch (error) {
    console.error("[getManageMess] Error executing query:", error);
    throw new Error("Failed to fetch mess data.");
  }
};

const updateMessDetails = async (parameter) => {
  console.log("[updateMessDetails] Received parameters:", parameter);

  try {
    // Begin transaction
    const transaction = await sequelize.transaction();

    try {
      // Update TB_MSP table
      const mspQuery = `
        UPDATE TB_MSP
        SET MSP_NAME = ?,
            MSP_TYPE = ?,
            MSP_CAPACITY = ?,
            MSP_AUTO_CNFM = ?,
            MSP_DELIVERY = ?,
            MSP_LSTRT_HRS = ?,
            MSP_LEND_HRS = ?,
            MSP_DSTRT_HRS = ?,
            MSP_DEND_HRS = ?,
            DINE_IN = ?,
            TAKE_AWAY = ?,
            MSP_APPROVED = ?,
            MSP_CATEGORY = ?,
            MSP_Image = ?,
            MSP_Image2 = ?,
            MSP_Image3 = ?,
            MSP_RATING = ?,
            Offer_1 = ?,
            Offer_2 = ?,
            Offer_3 = ?,
            cuisines = ?
        WHERE MSP_ID = ?
      `;

      await sequelize.query(mspQuery, {
        replacements: [
          parameter.MSP_NAME,
          parameter.MSP_TYPE,
          parameter.MSP_CAPACITY,
          parameter.MSP_AUTO_CNFM,
          parameter.MSP_DELIVERY,
          parameter.MSP_LSTRT_HRS,
          parameter.MSP_LEND_HRS,
          parameter.MSP_DSTRT_HRS,
          parameter.MSP_DEND_HRS,
          parameter.DINE_IN,
          parameter.TAKE_AWAY,
          parameter.MSP_APPROVED || parameter.status,
          parameter.MSP_CATEGORY || parameter.category,
          parameter.MSP_Image,
          parameter.MSP_Image2,
          parameter.MSP_Image3,
          parameter.MSP_RATING,
          parameter.Offer_1,
          parameter.Offer_2,
          parameter.Offer_3,
          parameter.cuisines,
          parameter.mspId,
        ],
        type: QueryTypes.UPDATE,
        transaction,
      });

      // Update user information
      const nameParts = parameter.U_FULL_NAME.split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      const userQuery = `
        UPDATE TB_USER
        SET U_FNAME = ?,
            U_LNAME = ?,
            U_EMAIL = ?,
            U_MOBILE = ?
        WHERE U_USERID = (SELECT MSP_USRID FROM TB_MSP WHERE MSP_ID = ?)
      `;

      await sequelize.query(userQuery, {
        replacements: [
          firstName,
          lastName,
          parameter.U_EMAIL,
          parameter.U_MOBILE,
          parameter.mspId,
        ],
        type: QueryTypes.UPDATE,
        transaction,
      });

      // Update address information
      const addressQuery = `
        UPDATE TB_MSP_ADDRESS
        SET AD_LINE1 = ?,
            AD_UPD_DATE = NOW()
        WHERE AD_USERID = (SELECT MSP_USRID FROM TB_MSP WHERE MSP_ID = ?)
      `;

      await sequelize.query(addressQuery, {
        replacements: [parameter.AD_LINE1, parameter.mspId],
        type: QueryTypes.UPDATE,
        transaction,
      });

      // Update bank details
      const bankQuery = `
        UPDATE TB_BANKDETAILS
        SET B_BANKNAME = ?,
            B_ACCOUNTNUMBER = ?,
            B_IFSCCODE = ?
        WHERE B_USERID = (SELECT MSP_USRID FROM TB_MSP WHERE MSP_ID = ?)
      `;

      await sequelize.query(bankQuery, {
        replacements: [
          parameter.B_BANKNAME,
          parameter.B_ACCOUNTNUMBER,
          parameter.B_IFSCCODE,
          parameter.mspId,
        ],
        type: QueryTypes.UPDATE,
        transaction,
      });

      // Update menu price if provided
      if (parameter.price) {
        // Get the menu item with the lowest price for this MSP
        const getMenuItemQuery = `
          SELECT M_ID 
          FROM TB_MENU 
          WHERE M_MSPID = ? 
          ORDER BY M_PRICE ASC 
          LIMIT 1
        `;

        const menuItems = await sequelize.query(getMenuItemQuery, {
          replacements: [parameter.mspId],
          type: QueryTypes.SELECT,
          transaction,
        });

        if (menuItems && menuItems.length > 0) {
          const updateMenuPriceQuery = `
            UPDATE TB_MENU
            SET M_PRICE = ?
            WHERE M_ID = ?
          `;

          await sequelize.query(updateMenuPriceQuery, {
            replacements: [parameter.price, menuItems[0].M_ID],
            type: QueryTypes.UPDATE,
            transaction,
          });

          console.log(
            `[updateMessDetails] Updated menu item ${menuItems[0].M_ID} price to ${parameter.price}`
          );
        } else {
          console.log(
            `[updateMessDetails] No menu items found for MSP ${parameter.mspId}`
          );
        }
      }

      // Commit transaction
      await transaction.commit();

      console.log("[updateMessDetails] Update successful");
      return "Business details updated successfully.";
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error("[updateMessDetails] Error executing update:", error);
      throw error;
    }
  } catch (error) {
    console.error("[updateMessDetails] Transaction error:", error);
    throw new Error("Failed to update business details.");
  }
};

const editAdminChrg = async (parameter) => {
  console.log("[editAdminChrg] Received parameters:", parameter);

  const query = `
    UPDATE TB_ADMIN_CHG
    SET ADMIN_CHG = ?, STATUS = ?
    WHERE MSPID = ?
  `;

  try {
    const result = await sequelize.query(query, {
      replacements: [parameter.admin, parameter.active, parameter.mspId],
      type: QueryTypes.UPDATE,
    });

    console.log("[editAdminChrg] Update result:", result);
    return "Admin charges updated successfully.";
  } catch (error) {
    console.error("[editAdminChrg] Error updating admin charges:", error);
    throw new Error("Failed to update admin charges.");
  }
};
