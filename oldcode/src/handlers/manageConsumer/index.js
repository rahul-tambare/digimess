let { HTTP_CODE, getResponseObject } = require("common-layer/utils/helper.js");
let service = require("./service");
let Schema = require("./schema");

exports.handler = async (event, context) => {
  let parameter = null;

  try {
    console.log("Event - ", event);

    // Handle both GET and POST requests
    if (event.httpMethod === "GET") {
      // For GET requests, get parameters from queryStringParameters
      parameter = event.queryStringParameters || {};
    } else {
      // For POST requests, parse the body
      if (event.body) {
        parameter = JSON.parse(event.body);
      } else {
        parameter = {};
      }
    }

    console.log("Parameters - ", parameter);

    // Set default requestType if not provided
    const { requestType = "GET_ALL_USERS", userId } = parameter;

    // Validate userId for user-specific requests
    if (
      ["GET_COMPLETE_USER_DATA", "ADD_WALLET_TRANSACTION"].includes(requestType)
    ) {
      if (!userId) {
        return getResponseObject(
          false,
          HTTP_CODE.BAD_REQUEST,
          { isValid: false },
          "User ID is required for this request type"
        );
      }
    }

    // Additional validation for ADD_WALLET_TRANSACTION
    if (requestType === "ADD_WALLET_TRANSACTION") {
      const { amount, type, notes } = parameter;

      if (!amount || amount <= 0) {
        return getResponseObject(
          false,
          HTTP_CODE.BAD_REQUEST,
          { isValid: false },
          "Valid amount is required and must be greater than 0"
        );
      }

      if (!type || !["credit", "debit"].includes(type)) {
        return getResponseObject(
          false,
          HTTP_CODE.BAD_REQUEST,
          { isValid: false },
          "Transaction type must be 'credit' or 'debit'"
        );
      }

      if (!notes || !notes.trim()) {
        return getResponseObject(
          false,
          HTTP_CODE.BAD_REQUEST,
          { isValid: false },
          "Transaction notes/reason is required"
        );
      }
    }

    let response = await service.getManageConsumer(parameter);

    console.log("Response length:", response.length);

    if (response.length > 0) {
      // Create response based on request type
      let responseData = {
        isValid: true,
        requestType: requestType,
        totalRecords: response.length,
      };

      // Add specific metadata based on request type
      switch (requestType) {
        case "GET_ALL_USERS":
          responseData.customerSummary = {
            totalCustomers: response.length,
            customersWithWallet: response.filter(
              (c) => (c.WALLET_BALANCE || 0) > 0
            ).length,
            totalWalletValue: response.reduce(
              (sum, c) => sum + (c.WALLET_BALANCE || 0),
              0
            ),
          };
          break;

        case "GET_COMPLETE_USER_DATA":
          const completeData = response[0];
          responseData.completeDataInfo = {
            userId: userId,
            customerName: completeData.userDetails?.U_FULLNAME,
            currentBalance: completeData.summary?.currentBalance || 0,
            totalTransactions:
              completeData.summary?.totalWalletTransactions || 0,
            totalOrders: completeData.summary?.totalOrders || 0,
            lifetimeCredit: completeData.summary?.lifetimeCredit || 0,
            lifetimeDebit: completeData.summary?.lifetimeDebit || 0,
          };
          break;

        case "ADD_WALLET_TRANSACTION":
          const transactionResult = response[0];
          responseData.transactionResult = {
            success: transactionResult.success,
            transactionId: transactionResult.transactionId,
            userId: transactionResult.userId,
            transactionType: transactionResult.transactionType,
            amount: transactionResult.amount,
            previousBalance: transactionResult.previousBalance,
            newBalance: transactionResult.newBalance,
            notes: transactionResult.notes,
            requestId: transactionResult.requestId,
            createdAt: transactionResult.createdAt,
          };

          return getResponseObject(
            true,
            HTTP_CODE.SUCCESS,
            responseData,
            `Wallet transaction completed successfully. ${
              transactionResult.transactionType === "credit"
                ? "Added"
                : "Deducted"
            } ₹${transactionResult.amount} ${
              transactionResult.transactionType === "credit" ? "to" : "from"
            } user's wallet. New balance: ₹${transactionResult.newBalance}`
          );

        default:
          responseData.message = "Request processed successfully";
      }

      return getResponseObject(true, HTTP_CODE.SUCCESS, responseData, response);
    } else {
      return getResponseObject(
        false,
        HTTP_CODE.FAILURE,
        {
          isValid: true,
          requestType: requestType,
          message: getNoDataMessage(requestType, userId),
        },
        getNoDataMessage(requestType, userId)
      );
    }
  } catch (error) {
    console.log("Error in getmanageConsumer Detail handler: ", error);

    // Safe error handling - don't reference potentially undefined variables
    const safeRequestType = parameter?.requestType || "UNKNOWN";

    // Special handling for wallet transaction errors
    if (safeRequestType === "ADD_WALLET_TRANSACTION") {
      return getResponseObject(
        false,
        HTTP_CODE.INTERNAL_SERVER_ERROR,
        {
          isValid: false,
          requestType: safeRequestType,
          errorType: "TRANSACTION_ERROR",
          transactionFailed: true,
        },
        `Wallet transaction failed: ${
          error.message || "An unexpected error occurred during the transaction"
        }`
      );
    }

    return getResponseObject(
      false,
      HTTP_CODE.INTERNAL_SERVER_ERROR,
      {
        isValid: false,
        requestType: safeRequestType,
        errorType: "SERVER_ERROR",
      },
      error.message || "An unexpected error occurred"
    );
  }
};

// Helper function to get appropriate no data message
const getNoDataMessage = (requestType, userId) => {
  switch (requestType) {
    case "GET_ALL_USERS":
      return "No customers found in the system";
    case "GET_COMPLETE_USER_DATA":
      return `No data found for user ID: ${userId}. User may not exist or have insufficient data.`;
    case "ADD_WALLET_TRANSACTION":
      return `Failed to process wallet transaction for user ID: ${userId}`;
    default:
      return "No data available for the requested operation";
  }
};
