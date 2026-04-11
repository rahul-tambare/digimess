const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

exports.getManageConsumer = async (parameter) => {
  console.log("Inside getManageConsumer method");
  console.log("Parameters received:", parameter);

  try {
    // Handle query string parameters (they come as strings)
    const requestType = parameter.requestType || "GET_ALL_USERS";
    const userId = parameter.userId ? parseInt(parameter.userId) : null;
    const limit = parameter.limit ? parseInt(parameter.limit) : 5000;
    const page = parameter.page ? parseInt(parameter.page) : 0;

    console.log("Processed parameters:", { requestType, userId, limit, page });

    switch (requestType) {
      case "GET_ALL_USERS":
        return await getAllUsers(parameter);

      case "GET_COMPLETE_USER_DATA":
        return await getCompleteUserData(userId, limit);

      case "ADD_WALLET_TRANSACTION":
        return await addWalletTransaction(parameter);

      default:
        // Default behavior - get all users (backward compatibility)
        return await getAllUsers(parameter);
    }
  } catch (error) {
    console.error("Error in getManageConsumer service:", error);
    throw error;
  }
};

// ===================================================================
// 1. GET ALL USERS WITH WALLET SUMMARY (OPTIMIZED)
// ===================================================================
const getAllUsers = async (parameter) => {
  console.log("Executing getAllUsers query");

  try {
    let query = `
        SELECT 
        ROW_NUMBER() OVER (ORDER BY A.U_USERID DESC) AS SERIAL_NUMBER,
        A.U_USERID,
        CONCAT(A.U_FNAME, ' ', A.U_LNAME) AS U_FULLNAME,
        A.U_FNAME,
        A.U_LNAME,
        A.U_EMAIL,
        A.U_MOBILE,
        A.U_TYPE,
        A.U_DATE,
        A.U_STATUS,
        A.U_GENDER,
        A.U_DOB,
        COALESCE(B.AD_LINE, '') AS AD_LINE,
        COALESCE(B.AD_CITY, '') AS AD_CITY,
        COALESCE(B.AD_STATE, '') AS AD_STATE,
        COALESCE(B.AD_PIN, '') AS AD_PIN,
        
        COALESCE(W.CURRENT_BALANCE, 0) AS WALLET_BALANCE,
        COALESCE(W.TOTAL_TRANSACTIONS, 0) AS TOTAL_TRANSACTIONS,
        
        COALESCE(O.TOTAL_ORDERS, 0) AS TOTAL_ORDERS,
        COALESCE(O.COMPLETED_ORDERS, 0) AS COMPLETED_ORDERS,
        COALESCE(O.CANCELLED_ORDERS, 0) AS CANCELLED_ORDERS,
        COALESCE(O.TOTAL_ORDER_AMOUNT, 0) AS TOTAL_ORDER_AMOUNT,
        O.LAST_ORDER_DATE,
        O.LAST_ORDER_STATUS
        
    FROM TB_USER A
    LEFT JOIN TB_CON_ADDRESS B ON B.AD_USERID = A.U_USERID AND B.AD_DEFAULT = 1
    
    LEFT JOIN (
        SELECT 
            TR_USERID,
            COUNT(*) AS TOTAL_TRANSACTIONS,
            (SELECT TR_BAL FROM TB_CONS_TRANSACTION WHERE TR_USERID = t.TR_USERID ORDER BY TR_ID DESC LIMIT 1) AS CURRENT_BALANCE
        FROM TB_CONS_TRANSACTION t
        GROUP BY TR_USERID
    ) W ON W.TR_USERID = A.U_USERID
    
    LEFT JOIN (
        SELECT 
            O_USERID,
            COUNT(*) AS TOTAL_ORDERS,
            SUM(CASE WHEN O_STATUS = 'COMPLETED' THEN 1 ELSE 0 END) AS COMPLETED_ORDERS,
            SUM(CASE WHEN O_STATUS = 'CANCELLED' THEN 1 ELSE 0 END) AS CANCELLED_ORDERS,
            SUM(O_FINAL_AMOUNT) AS TOTAL_ORDER_AMOUNT,
            MAX(O_CR_DATE) AS LAST_ORDER_DATE,
            (SELECT O_STATUS FROM TB_ORDER WHERE O_USERID = subq.O_USERID ORDER BY O_CR_DATE DESC LIMIT 1) AS LAST_ORDER_STATUS
        FROM TB_ORDER subq
        GROUP BY O_USERID
    ) O ON O.O_USERID = A.U_USERID
    
    WHERE A.U_TYPE = 2
    ORDER BY A.U_USERID DESC
        `;

    let result = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    console.log(
      "getAllUsers query executed successfully, returned",
      result.length,
      "records"
    );
    return result;
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    throw error;
  }
};

// ===================================================================
// 2. GET COMPLETE USER DATA (COMBINED: DETAILS + WALLET + ORDERS)
// ===================================================================
const getCompleteUserData = async (userId, limit = 50000) => {
  console.log("Executing getCompleteUserData query for userId:", userId);

  if (!userId) {
    throw new Error("User ID is required for complete user data");
  }

  try {
    // Get basic user details
    const userDetailsQuery = `
        SELECT 
        A.U_USERID,
        CONCAT(A.U_FNAME, ' ', A.U_LNAME) AS U_FULLNAME,
        A.U_FNAME,
        A.U_LNAME,
        A.U_EMAIL,
        A.U_MOBILE,
        A.U_TYPE,
        A.U_GENDER,
        A.U_DOB,
        A.U_DATE AS REGISTRATION_DATE,
        A.U_STATUS,
        
        B.AD_LINE,
        B.AD_LINE2,
        B.AD_CITY,
        B.AD_STATE,
        B.AD_PIN,
        B.AD_Name AS ADDRESS_NAME,
        
        COALESCE(W.CURRENT_BALANCE, 0) AS WALLET_BALANCE,
        COALESCE(W.TOTAL_TRANSACTIONS, 0) AS TOTAL_TRANSACTIONS,
        COALESCE(W.LIFETIME_CREDIT, 0) AS LIFETIME_CREDIT,
        COALESCE(W.LIFETIME_DEBIT, 0) AS LIFETIME_DEBIT,
        W.LAST_TRANSACTION_DATE,
        
        COALESCE(O.TOTAL_ORDERS, 0) AS TOTAL_ORDERS,
        COALESCE(O.COMPLETED_ORDERS, 0) AS COMPLETED_ORDERS,
        COALESCE(O.CANCELLED_ORDERS, 0) AS CANCELLED_ORDERS,
        COALESCE(O.TOTAL_ORDER_VALUE, 0) AS TOTAL_ORDER_VALUE,
        O.LAST_ORDER_DATE,
        O.LAST_ORDER_STATUS
        
    FROM TB_USER A
    LEFT JOIN TB_CON_ADDRESS B ON B.AD_USERID = A.U_USERID AND B.AD_DEFAULT = 1
    LEFT JOIN (
        SELECT 
            TR_USERID,
            COUNT(*) AS TOTAL_TRANSACTIONS,
            SUM(COALESCE(TR_CREDIT, 0)) AS LIFETIME_CREDIT,
            SUM(COALESCE(TR_DEBIT, 0)) AS LIFETIME_DEBIT,
              (SELECT TR_BAL FROM TB_CONS_TRANSACTION WHERE TR_USERID = T.TR_USERID ORDER BY TR_ID DESC LIMIT 1) AS CURRENT_BALANCE,
            MAX(TR_CR_DATE) AS LAST_TRANSACTION_DATE
        FROM TB_CONS_TRANSACTION T
        GROUP BY TR_USERID
    ) W ON W.TR_USERID = A.U_USERID
    LEFT JOIN (
        SELECT 
            O_USERID,
            COUNT(*) AS TOTAL_ORDERS,
            SUM(CASE WHEN O_STATUS = 'COMPLETED' THEN 1 ELSE 0 END) AS COMPLETED_ORDERS,
            SUM(CASE WHEN O_STATUS = 'CANCELLED' THEN 1 ELSE 0 END) AS CANCELLED_ORDERS,
            SUM(O_FINAL_AMOUNT) AS TOTAL_ORDER_VALUE,
            MAX(O_CR_DATE) AS LAST_ORDER_DATE,
            (SELECT O_STATUS FROM TB_ORDER WHERE O_USERID = OO.O_USERID ORDER BY O_CR_DATE DESC LIMIT 1) AS LAST_ORDER_STATUS
        FROM TB_ORDER OO
        GROUP BY O_USERID
    ) O ON O.O_USERID = A.U_USERID
    
    WHERE A.U_USERID = ? AND A.U_TYPE = 2;
        `;

    // Get wallet transaction history
    const walletHistoryQuery = `
        SELECT 
        T.TR_ID,
        T.TR_USERID,
        T.TR_SRC_ID,
        T.TR_CREDIT,
        T.TR_DEBIT,
        T.TR_BAL AS RUNNING_BALANCE,
        T.TR_CR_DATE AS TRANSACTION_DATE,
        T.TR_TYPE,
        T.TR_NOTES,
        T.TR_REQUEST_ID,
        
        CASE 
            WHEN T.TR_CREDIT > 0 THEN 'CREDIT'
            WHEN T.TR_DEBIT > 0 THEN 'DEBIT'
            ELSE 'NEUTRAL'
        END AS TRANSACTION_DIRECTION,
        
        CASE 
            WHEN T.TR_TYPE = 'RECHARGE' THEN 'Wallet Recharge'
            WHEN T.TR_TYPE = 'ORDER_DEBIT' THEN 'Order Payment'
            WHEN T.TR_TYPE = 'REFUND' THEN 'Order Refund'
            WHEN T.TR_TYPE = 'MANUAL_ADMIN' THEN 'Admin Adjustment'
            WHEN T.TR_TYPE = 'BONUS' THEN 'Bonus Credit'
            ELSE 'Other Transaction'
        END AS TRANSACTION_CATEGORY,
        
        COALESCE(T.TR_CREDIT, T.TR_DEBIT, 0) AS TRANSACTION_AMOUNT
    FROM TB_CONS_TRANSACTION T
    WHERE T.TR_USERID = ?
    ORDER BY T.TR_ID DESC
    LIMIT 50000;
        `;

    // Get order history
    const orderHistoryQuery = `
            SELECT 
                O.O_ID,
                O.O_USERID,
                O.O_MSPID,
                O.O_AMOUNT,
                O.O_DISC,
                O.O_TAKEWAY_CHG,
                O.O_DEL_CHG,
                O.O_FINAL_AMOUNT,
                O.O_CR_DATE,
                O.O_STATUS,
                O.O_UPD_DT,
                O.O_TYPE,
                O.O_Address,
                O.O_Notes,
                
                -- Customer Information
                CONCAT(U.U_FNAME, ' ', U.U_LNAME) AS CUSTOMER_NAME,
                U.U_EMAIL,
                U.U_MOBILE,
                
                -- Restaurant Information
                M.MSP_NAME AS RESTAURANT_NAME,
                M.MSP_TYPE AS RESTAURANT_TYPE,
                M.MSP_CATEGORY,
                
                -- Order Items Summary
                COALESCE(OD.ITEM_COUNT, 0) AS ITEM_COUNT,
                COALESCE(OD.TOTAL_QUANTITY, 0) AS TOTAL_QUANTITY,
                COALESCE(OD.ITEMS_SUMMARY, 'No items found') AS ITEMS_SUMMARY,
                
                -- Order Status Description
                CASE 
                    WHEN O.O_STATUS = 'COMPLETED' THEN 'Order Completed Successfully'
                    WHEN O.O_STATUS = 'PENDING' THEN 'Order is Pending'
                    WHEN O.O_STATUS = 'PROCESSING' THEN 'Order is Being Prepared'
                    WHEN O.O_STATUS = 'CANCELLED' THEN 'Order was Cancelled'
                    WHEN O.O_STATUS = 'DELIVERED' THEN 'Order Delivered'
                    ELSE O.O_STATUS
                END AS STATUS_DESCRIPTION

            FROM TB_ORDER O
            INNER JOIN TB_USER U ON U.U_USERID = O.O_USERID
            LEFT JOIN TB_MSP M ON M.MSP_ID = O.O_MSPID
            LEFT JOIN (
                SELECT 
                    OD_OID,
                    COUNT(*) AS ITEM_COUNT,
                    SUM(COALESCE(OD_QTY, 1)) AS TOTAL_QUANTITY,
                    GROUP_CONCAT(
                        CONCAT(COALESCE(OD_MENUITEMS, 'Unknown Item'), ' (', COALESCE(OD_QTY, 1), ')')
                        ORDER BY OD_ID 
                        SEPARATOR ', '
                    ) AS ITEMS_SUMMARY
                FROM TB_ORDER_DETAILS
                GROUP BY OD_OID
            ) OD ON OD.OD_OID = O.O_ID

            WHERE O.O_USERID = ?
            ORDER BY O.O_CR_DATE DESC, O.O_ID DESC
            LIMIT 5000;
        `;

    // Execute all queries in parallel
    const [userDetails, walletHistory, orderHistory] = await Promise.all([
      sequelize.query(userDetailsQuery, {
        replacements: [userId],
        type: QueryTypes.SELECT,
      }),
      sequelize.query(walletHistoryQuery, {
        replacements: [userId, limit],
        type: QueryTypes.SELECT,
      }),
      sequelize.query(orderHistoryQuery, {
        replacements: [userId, limit],
        type: QueryTypes.SELECT,
      }),
    ]);

    console.log("getCompleteUserData query executed successfully");

    // Return combined data structure
    return [
      {
        userDetails: userDetails[0] || null,
        walletHistory: walletHistory || [],
        orderHistory: orderHistory || [],
        summary: {
          totalWalletTransactions: walletHistory.length,
          totalOrders: orderHistory.length,
          currentBalance: userDetails[0]?.WALLET_BALANCE || 0,
          lifetimeCredit: userDetails[0]?.LIFETIME_CREDIT || 0,
          lifetimeDebit: userDetails[0]?.LIFETIME_DEBIT || 0,
        },
      },
    ];
  } catch (error) {
    console.error("Error in getCompleteUserData:", error);
    throw error;
  }
};

// ===================================================================
// 3. ADD WALLET TRANSACTION (UNCHANGED)
// ===================================================================
const addWalletTransaction = async (parameter) => {
  console.log("Executing addWalletTransaction");
  console.log("Transaction parameters:", parameter);

  const { userId, amount, type, notes, transactionType } = parameter;

  // Validate input parameters
  if (!userId) {
    throw new Error("User ID is required");
  }

  // Convert amount to number and validate
  const numericAmount = parseFloat(amount);
  if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("Valid positive amount is required");
  }
  if (!type || !["credit", "debit"].includes(type)) {
    throw new Error("Transaction type must be 'credit' or 'debit'");
  }
  if (!notes || !notes.trim()) {
    throw new Error("Transaction notes/reason is required");
  }

  const transaction = await sequelize.transaction();

  try {
    // Get the last transaction's running balance (most accurate)
    const currentBalanceQuery = `
            SELECT 
                COALESCE(TR_BAL, 0) AS CURRENT_BALANCE
            FROM TB_CONS_TRANSACTION 
            WHERE TR_USERID = ?
            ORDER BY TR_CR_DATE DESC, TR_ID DESC
            LIMIT 1
        `;

    const balanceResult = await sequelize.query(currentBalanceQuery, {
      replacements: [userId],
      type: QueryTypes.SELECT,
      transaction,
    });

    const currentBalance = balanceResult[0]?.CURRENT_BALANCE || 0;
    console.log(
      "Last transaction balance for user",
      userId,
      ":",
      currentBalance
    );

    // Calculate new balance based on transaction type
    let newBalance;
    let creditAmount = 0;
    let debitAmount = 0;

    // Convert amount to number to ensure proper arithmetic
    const numericAmount = parseFloat(amount);
    const numericCurrentBalance = parseFloat(currentBalance) || 0;

    if (type === "credit") {
      creditAmount = numericAmount;
      newBalance = numericCurrentBalance + numericAmount;
    } else {
      debitAmount = numericAmount;
      newBalance = numericCurrentBalance - numericAmount;
    }

    console.log("Transaction details:", {
      type,
      creditAmount,
      debitAmount,
      currentBalance: numericCurrentBalance,
      newBalance,
      originalAmount: amount,
      numericAmount,
    });

    // Generate a unique request ID for tracking
    const requestId = `ADMIN_${Date.now()}_${userId}`;

    // Insert the new transaction record
    const insertTransactionQuery = `
            INSERT INTO TB_CONS_TRANSACTION (
                TR_USERID,
                TR_SRC_ID,
                TR_CREDIT,
                TR_DEBIT,
                TR_BAL,
                TR_CR_DATE,
                TR_TYPE,
                TR_NOTES,
                TR_REQUEST_ID
            ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?)
        `;

    const insertResult = await sequelize.query(insertTransactionQuery, {
      replacements: [
        userId,
        `ADMIN_MANUAL_${Date.now()}`, // TR_SRC_ID
        creditAmount > 0 ? creditAmount : null,
        debitAmount > 0 ? debitAmount : null,
        newBalance, // TR_BAL (running balance)
        transactionType || "MANUAL_ADMIN", // TR_TYPE
        `Admin Transaction: ${notes.trim()}`, // TR_NOTES
        requestId, // TR_REQUEST_ID
      ],
      type: QueryTypes.INSERT,
      transaction,
    });

    console.log("Transaction inserted successfully with ID:", insertResult[0]);

    // Commit the transaction
    await transaction.commit();

    console.log("Wallet transaction completed successfully");

    // Return the transaction details
    return [
      {
        success: true,
        transactionId: insertResult[0],
        userId: userId,
        transactionType: type,
        amount: numericAmount,
        previousBalance: numericCurrentBalance,
        newBalance: newBalance,
        notes: notes,
        requestId: requestId,
        createdAt: new Date().toISOString(),
      },
    ];
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    console.error("Error in addWalletTransaction:", error);
    throw new Error(`Failed to add wallet transaction: ${error.message}`);
  }
};
