const {
  sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");
const { nodemailer } = require("common-layer/utils/packageExports.js");

const currentDate = new Date().toISOString().slice(0, 19).replace("T", " ");
const sysdate = [currentDate];

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "techsupport@khanaanywhere.com",
    pass: "TechKhana#24",
  },
});

const sendEmailNotification = async (orderDetails) => {
  try {
    // Fetch consumer name and MSP name from DB
    const query = `
      SELECT 
          CONCAT(U.U_FNAME, ' ', U.U_LNAME, ' (', U.U_MOBILE,' )') AS CONSUMER_NAME, 
          M.MSP_NAME 
      FROM 
          TB_USER U, 
          TB_MSP M 
      WHERE 
          U.U_USERID = ? 
          AND M.MSP_ID = ?
      ORDER BY 
          U.U_USERID DESC, 
          M.MSP_NAME DESC;
    `;

    const [result] = await sequelize.query(query, {
      replacements: [orderDetails.userID, orderDetails.mspID],
      type: QueryTypes.SELECT,
    });

    // Extract consumer name and MSP name
    const consumerName = result?.CONSUMER_NAME || "Unknown";
    const mspName = result?.MSP_NAME || "Unknown MSP";

    // Get current date and time
    const sysdate = new Date().toLocaleString();

    // Construct HTML email body
    const emailHtml = `
      <p>Hello Admin,</p>
      <p>There is a new order with the following details:</p>
      <table border="1" cellspacing="0" cellpadding="8" style="border-collapse: collapse;">
        <tr><td><b>Customer ID</b></td><td>${orderDetails.userID}</td></tr>
        <tr><td><b>Customer Name</b></td><td>${consumerName}</td></tr>
        <tr><td><b>MSP ID</b></td><td>${orderDetails.mspID}</td></tr>
        <tr><td><b>MSP Name</b></td><td>${mspName}</td></tr>
        <tr><td><b>Order ID</b></td><td>${orderDetails.orderID}</td></tr>
        <tr><td><b>Order Amount</b></td><td>${orderDetails.finalAmount}</td></tr>
        <tr><td><b>Date Time</b></td><td>${sysdate}</td></tr>
      </table>
      <p>Please have a look.</p>
      <p>Regards,<br>Team KhanaAnywhere</p>
    `;

    // Send email
    await transporter.sendMail({
      from: "techsupport@khanaanywhere.com",
      to: "jeeva7777@gmail.com, abhilash.goje.111@gmail.com",
      subject: `New Order Alert - Order ID ${orderDetails.orderID}`,
      html: emailHtml, // Use HTML instead of plain text
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

exports.createMealOrder = async (parameter) => {
  try {
    console.log("Inside createMealOrder method", parameter);

    let userBalance =
      (await getConsumerBalance(parameter.userID))?.[0]?.TR_BAL || 0;
    console.log(
      "User Balance:",
      userBalance,
      "Ordered Amount:",
      parameter.finalAmount
    );

    if (userBalance < parameter.finalAmount) {
      return {
        status: "Failure",
        statusCode: 500,
        message: "Insufficient balance",
      };
    }

    const orderResult = await insertIntoOrder(parameter);
    if (orderResult.result[1] !== 1) {
      return {
        status: "Failure",
        statusCode: 500,
        message: "Order insertion failed",
      };
    }

    parameter.orderID = orderResult.orderID;
    parameter.balance = userBalance - parameter.finalAmount;
    const transactionResult = await insertToTransaction(parameter);

    if (transactionResult[1] !== 1) {
      return {
        status: "Failure",
        statusCode: 500,
        message: "Transaction insertion failed",
      };
    }

    // Send email notification
    await sendEmailNotification(
      parameter,
      "jeeva7777@gmail.com, abhilash.goje.111@gmail.com"
    ); // Replace with actual recipient email

    return {
      status: "SUCCESS",
      statusCode: 200,
      message: parameter.orderID,
      orderID: parameter.orderID,
    };
  } catch (error) {
    console.error("Error in createMealOrder:", error);
    throw error;
  }
};

const insertIntoOrder = async (insertData) => {
  try {
    console.log("Inside insertIntoOrder method", insertData);

    let orderStatus = await findOrderStatus(insertData.mspID);
    let sysdate = new Date(); // or your preferred method

    let baseQuery = `
      INSERT INTO TB_ORDER (O_Notes,O_USERID, O_MSPID, O_AMOUNT, O_DISC, O_DISC_TYPE,O_TAKEWAY_CHG, O_DEL_CHG, O_FINAL_AMOUNT,O_CR_DATE, O_STATUS, O_TYPE, O_PLATFM_FEE${
        insertData.deliveryAddress ? ", O_Address" : ""
      }) VALUES (?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?${
      insertData.deliveryAddress ? ", ?" : ""
    })
    `;

    let replacements = [
      insertData.notes || "",
      insertData.userID,
      insertData.mspID,
      insertData.amount,
      insertData.discount,
      insertData.pkgID,
      insertData.takeawaycharge,
      insertData.deliveryCharge,
      insertData.finalAmount,
      sysdate,
      orderStatus,
      insertData.ordertype,
      insertData.platformfee,
    ];

    if (insertData.deliveryAddress) {
      replacements.push(insertData.deliveryAddress);
    }

    let result = await sequelize.query(baseQuery, {
      replacements,
      type: QueryTypes.INSERT,
    });

    for (let menu of insertData.menu) {
      const menuQTY = menu.menuQTY !== undefined ? menu.menuQTY : 1;
      const menuPrice = menu.menuPrice !== undefined ? menu.menuPrice : null;
      await insertIntoOrderDetails(
        result[0],
        menu.menuID,
        menu.menuItems,
        menuPrice,
        menuQTY
      );
    }

    return { result, orderID: result[0] };
  } catch (error) {
    console.error("Error in insertIntoOrder:", error);
    throw error;
  }
};

const insertIntoOrderDetails = async (
  orderID,
  menuID,
  menuItems,
  menuPrice,
  menuQTY
) => {
  try {
    console.log("Inside insertIntoOrderDetails method");
    menuPrice = menuPrice !== undefined ? menuPrice : "";
    menuQTY = menuQTY !== undefined ? menuQTY : 1;
    let query = `INSERT INTO TB_ORDER_DETAILS (OD_OID, OD_MENUID, OD_MENUITEMS,OD_Price,OD_QTY) VALUES (?,?,?,?,?)`;
    return await sequelize.query(query, {
      replacements: [orderID, menuID, menuItems, menuPrice, menuQTY],
      type: QueryTypes.INSERT,
    });
  } catch (error) {
    console.error("Error in insertIntoOrderDetails:", error);
    throw error;
  }
};

const insertToTransaction = async (insertData) => {
  try {
    console.log("Inside insertToTransaction method");
    let query = `INSERT INTO TB_CONS_TRANSACTION (TR_USERID, TR_SRC_ID, TR_CREDIT, TR_DEBIT, TR_BAL, TR_CR_DATE) 
                 VALUES (?,?,?,?,?,?)`;
    return await sequelize.query(query, {
      replacements: [
        insertData.userID,
        insertData.orderID,
        0,
        insertData.finalAmount,
        insertData.balance,
        sysdate,
      ],
      type: QueryTypes.INSERT,
    });
  } catch (error) {
    console.error("Error in insertToTransaction:", error);
    throw error;
  }
};

const getConsumerBalance = async (userID) => {
  try {
    console.log("Inside getConsumerBalance method");
    let query = `SELECT TR_BAL FROM TB_CONS_TRANSACTION WHERE TR_USERID = ? ORDER BY TR_ID DESC LIMIT 1`;
    return await sequelize.query(query, {
      replacements: [userID],
      type: QueryTypes.SELECT,
    });
  } catch (error) {
    console.error("Error in getConsumerBalance:", error);
    throw error;
  }
};

const findOrderStatus = async (mspID) => {
  try {
    console.log("Inside findOrderStatus method");
    let query = `SELECT COUNT(*) < (SELECT MSP_AUTO_CNFM FROM TB_MSP WHERE MSP_ID = ?) AS AUTOCONFIRM 
                 FROM TB_ORDER WHERE O_MSPID = ? AND DATE(O_CR_DATE) = CURDATE()`;
    let result = await sequelize.query(query, {
      replacements: [mspID, mspID],
      type: QueryTypes.SELECT,
    });
    return result?.[0]?.AUTOCONFIRM === 1 ? "CONFIRMED" : "PENDING";
  } catch (error) {
    console.error("Error in findOrderStatus:", error);
    throw error;
  }
};
