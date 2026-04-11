const {
  sequelize,
  Sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");
const { Axios } = require("common-layer/utils/packageExports.js");
const { apiResponse } = require("common-layer/utils/helper.js");
const crypto = require("crypto");

// ========================================
// PAYMENT STATUSES AND AUDIT SYSTEM
// ========================================

// Payment Status Definitions
const PAYMENT_STATUSES = {
  INIT: "INIT",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  MANUAL_REVIEW: "MANUAL_REVIEW",
};

// Payment Actions for Audit
const AUDIT_ACTIONS = {
  PAYMENT_STARTED: "PAYMENT_STARTED",
  PAYMENT_GATEWAY_OPENED: "PAYMENT_GATEWAY_OPENED",
  PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PAYMENT_CANCELLED: "PAYMENT_CANCELLED",
  MANUAL_REVIEW_REQUIRED: "MANUAL_REVIEW_REQUIRED",
  SYSTEM_ERROR: "SYSTEM_ERROR",
  VERIFICATION_FAILED: "VERIFICATION_FAILED",
  WEBHOOK_RECEIVED: "WEBHOOK_RECEIVED",
  SECURITY_VIOLATION: "SECURITY_VIOLATION",
};

// Generate user-friendly audit messages
const generateAuditMessage = (action, oldStatus, newStatus, details = {}) => {
  const amount = details.amount ? `₹${details.amount}` : "";
  const orderID = details.orderID ? ` (Order: ${details.orderID})` : "";

  switch (action) {
    case AUDIT_ACTIONS.PAYMENT_STARTED:
      return `💰 Customer started payment of ${amount}. Wallet recharge request created successfully.`;

    case AUDIT_ACTIONS.PAYMENT_GATEWAY_OPENED:
      return `🌐 Payment gateway opened successfully. Customer redirected to secure payment page for ${amount}.`;

    case AUDIT_ACTIONS.PAYMENT_COMPLETED:
      return `🎉 Payment successful! ${amount} added to wallet. Transaction completed successfully${orderID}.`;

    case AUDIT_ACTIONS.PAYMENT_FAILED:
      return `❌ Payment failed. ${
        details.reason ||
        "Please try again or contact support if issue persists."
      } Amount: ${amount}${orderID}`;

    case AUDIT_ACTIONS.PAYMENT_CANCELLED:
      return `🚫 Payment cancelled by customer. Customer closed the payment page without completing transaction. Amount: ${amount}${orderID}`;

    case AUDIT_ACTIONS.MANUAL_REVIEW_REQUIRED:
      return `🔍 Payment marked for manual review. Unable to verify automatically. Support team will investigate. Amount: ${amount}${orderID}`;

    case AUDIT_ACTIONS.SYSTEM_ERROR:
      return `❌ Technical error occurred during payment processing. Our team has been notified. Amount: ${amount}${orderID}`;

    case AUDIT_ACTIONS.VERIFICATION_FAILED:
      return `⚠️ Payment verification failed. Unable to confirm transaction status with payment gateway. Amount: ${amount}${orderID}`;

    case AUDIT_ACTIONS.WEBHOOK_RECEIVED:
      return `📨 Payment webhook received from Cashfree. Status: ${
        details.status || "Unknown"
      }. Amount: ${amount}${orderID}`;

    case AUDIT_ACTIONS.SECURITY_VIOLATION:
      return `🚨 Security violation detected. Client reported SUCCESS but API verification failed. Amount: ${amount}${orderID}`;

    default:
      return `📊 Payment status updated from ${oldStatus || "Unknown"} to ${
        newStatus || "Unknown"
      }. Amount: ${amount}${orderID}`;
  }
};

// Enhanced audit logging function
const logAuditTrail = async (auditData) => {
  try {
    // Generate user-friendly message
    const userFriendlyMessage = generateAuditMessage(
      auditData.action,
      auditData.oldStatus,
      auditData.newStatus,
      {
        amount: auditData.amount,
        orderID: auditData.orderID,
        status: auditData.details?.status,
        reason: auditData.details?.reason,
      }
    );

    // Log to console
    console.log("📋 [Enhanced Audit Trail]:", {
      message: userFriendlyMessage,
      action: auditData.action,
      status: `${auditData.oldStatus} → ${auditData.newStatus}`,
      amount: auditData.amount,
    });

    try {
      const query = `
        INSERT INTO TB_PAYMENT_AUDIT
        (PA_USERID, PA_RECHARGE_ID, PA_ORDER_ID, PA_ACTION, PA_OLD_STATUS, PA_NEW_STATUS, PA_AMOUNT, PA_REQUEST_ID, PA_IP_ADDRESS, PA_USER_AGENT, PA_DETAILS, PA_TIMESTAMP)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      await sequelize.query(query, {
        replacements: [
          auditData.userID || null,
          auditData.rechargeID || null,
          auditData.orderID || null,
          auditData.action || "PAYMENT_EVENT",
          auditData.oldStatus || "UNKNOWN",
          auditData.newStatus || "UNKNOWN",
          auditData.amount || null,
          auditData.details?.requestId || null,
          auditData.details?.ipAddress || null,
          auditData.details?.userAgent
            ? auditData.details.userAgent.substring(0, 500)
            : null,
          JSON.stringify(auditData.details?.raw || userFriendlyMessage),
        ],
        type: QueryTypes.INSERT,
      });

      console.log("✅ [Enhanced Audit] Logged successfully:", auditData.action);
    } catch (dbError) {
      console.log(
        "⚠️ [Enhanced Audit] Database logging failed, using console only:",
        dbError.message
      );
    }
  } catch (error) {
    console.error("❌ [Enhanced Audit] Failed:", error.message);
  }
};

// ========================================
// SECURITY FUNCTIONS
// ========================================

// Rate limiting for payment attempts
const checkRateLimit = async (userID) => {
  try {
    const timeWindow = 15; // 15 minutes
    const maxAttempts = 5;

    const query = `
      SELECT COUNT(*) as attempt_count 
      FROM TB_PAYMENT_AUDIT 
      WHERE PA_USERID = ? 
      AND PA_ACTION = 'PAYMENT_STARTED' 
      AND PA_TIMESTAMP > DATE_SUB(NOW(), INTERVAL ? MINUTE)
    `;

    const result = await sequelize.query(query, {
      replacements: [userID, timeWindow],
      type: QueryTypes.SELECT,
    });

    const attemptCount = result[0]?.attempt_count || 0;

    if (attemptCount >= maxAttempts) {
      console.log(
        `🚨 [Rate Limit] User ${userID} exceeded ${maxAttempts} attempts in ${timeWindow} minutes`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ [Rate Limit] Check failed:", error.message);
    return true; // Allow on error to avoid blocking legitimate users
  }
};

// Verify webhook signature (implement based on Cashfree documentation)
const verifyWebhookSignature = (payload, signature, secret) => {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("❌ [Webhook Verification] Failed:", error.message);
    return false;
  }
};

// Check for duplicate transactions
const checkDuplicateTransaction = async (orderID, userID) => {
  try {
    const query = `
      SELECT R_ID, R_STATUS 
      FROM TB_RECHARGE 
      WHERE R_CFID = ? AND R_USERID = ? AND R_STATUS = 'SUCCESS'
      LIMIT 1
    `;

    const result = await sequelize.query(query, {
      replacements: [orderID, userID],
      type: QueryTypes.SELECT,
    });

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("❌ [Duplicate Check] Failed:", error.message);
    return null;
  }
};

// Create manual review task
const createManualReviewTask = async (reviewData) => {
  try {
    const query = `
      INSERT INTO TB_MANUAL_REVIEW 
      (MR_ORDER_ID, MR_USER_ID, MR_AMOUNT, MR_CLIENT_STATUS, MR_API_ERROR, MR_PRIORITY, MR_STATUS, MR_CREATED_DATE)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW())
    `;

    await sequelize.query(query, {
      replacements: [
        reviewData.orderID,
        reviewData.userID,
        reviewData.amount,
        reviewData.clientReportedStatus,
        reviewData.apiVerificationError || "",
        reviewData.amount > 1000 ? "HIGH" : "NORMAL",
      ],
      type: QueryTypes.INSERT,
    });

    console.log(
      "✅ [Manual Review] Task created for order:",
      reviewData.orderID
    );
  } catch (error) {
    console.error("❌ [Manual Review] Task creation failed:", error.message);
  }
};

// ========================================
// CASHFREE CONFIGURATION
// ========================================

// IMPORTANT: Update these credentials - consider loading from environment variables
const CASHFREE_CONFIG = {
  BASE_URL: process.env.CASHFREE_BASE_URL || "https://api.cashfree.com/pg", // Use environment variable
  CLIENT_ID: process.env.CASHFREE_CLIENT_ID || "91590f12edf8e3c27e11a6ac509519",
  CLIENT_SECRET:
    process.env.CASHFREE_CLIENT_SECRET ||
    "db0722745f07d1ae9234f464a25a50faa9302506",
  WEBHOOK_SECRET: process.env.CASHFREE_WEBHOOK_SECRET || "", // Add webhook secret
  API_VERSION: "2023-08-01", // Use latest API version
  TIMEOUT: 30000,
};

// Helper function to create consistent response format
const createResponse = (
  statusCode,
  data = null,
  message = "",
  extraFields = {}
) => {
  const response = {
    statusCode: statusCode,
    success: statusCode >= 200 && statusCode < 300,
    message: message,
    timestamp: new Date().toISOString(),
    ...extraFields,
  };

  if (data !== null) {
    response.data = data;
  }

  console.log(
    "🎯 [createResponse] Generated:",
    JSON.stringify(response, null, 2)
  );
  return response;
};

// Enhanced error logging function
const logError = async (errorData) => {
  try {
    console.error("🔥 [Payment Error]:", JSON.stringify(errorData, null, 2));

    try {
      const query = `
        INSERT INTO TB_PAYMENT_ERRORS
        (PE_USERID, PE_RECHARGE_ID, PE_ORDER_ID, PE_AMOUNT, PE_ERROR, PE_ERROR_TYPE, PE_DETAILS, PE_TIMESTAMP)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      await sequelize.query(query, {
        replacements: [
          errorData.userID || null,
          errorData.rechargeID || null,
          errorData.orderID || null,
          errorData.amount || null,
          errorData.error || "Unknown error",
          errorData.errorType || "GENERAL_ERROR",
          JSON.stringify(errorData.details || {}),
        ],
        type: QueryTypes.INSERT,
      });
      console.log("✅ [Error Logging] Logged to database successfully");
    } catch (dbError) {
      console.log(
        "⚠️ [Error Logging] Database logging failed, using console only:",
        dbError.message
      );
    }
  } catch (logError) {
    console.error("❌ [Error Logging] Failed:", logError.message);
  }
};

// Test database connection
const testDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ [Database] Connection test successful");
    return true;
  } catch (error) {
    console.error("❌ [Database] Connection test failed:", error.message);
    return false;
  }
};

// Check if a webhook already reported success for this order
async function checkWebhookSuccess(rechargeID) {
  try {
    const query = `SELECT PA_ACTION, PA_DETAILS 
                  FROM TB_PAYMENT_AUDIT 
                  WHERE PA_RECHARGE_ID = ? 
                  AND (PA_DETAILS LIKE '%txStatus%SUCCESS%' OR PA_DETAILS LIKE '%webhook%success%')
                  LIMIT 1`;

    const result = await sequelize.query(query, {
      replacements: [rechargeID],
      type: QueryTypes.SELECT,
    });

    const hasWebhookSuccess = result && result.length > 0;
    console.log(
      `[checkWebhookSuccess] Result for ${rechargeID}: ${hasWebhookSuccess}`
    );
    return hasWebhookSuccess;
  } catch (error) {
    console.error("❌ [checkWebhookSuccess] Error:", error.message);
    return false;
  }
}

// ========================================
// CASHFREE API INTEGRATION
// ========================================

// IMPROVED: Cashfree payment verification with multiple methods and retry logic
const verifyCashfreePayment = async (orderID) => {
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [3000, 5000, 10000]; // 3s, 5s, 10s delays

  console.log(
    `🔍 [verifyCashfreePayment] Verifying order: ${orderID} (Attempt 1/${MAX_RETRIES})`
  );

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Wait before making API call (except first attempt)
      if (attempt > 0) {
        console.log(
          `🔍 [verifyCashfreePayment] Verifying order: ${orderID} (Attempt ${
            attempt + 1
          }/${MAX_RETRIES})`
        );
      } else {
        console.log(`⏳ [verifyCashfreePayment] Initial delay of 3 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // FIRST ATTEMPT: Try orders endpoint
      try {
        const url = `${CASHFREE_CONFIG.BASE_URL}/orders/${orderID}`;
        const headers = {
          "Content-Type": "application/json",
          "x-api-version": CASHFREE_CONFIG.API_VERSION,
          "x-client-id": CASHFREE_CONFIG.CLIENT_ID,
          "x-client-secret": CASHFREE_CONFIG.CLIENT_SECRET,
        };

        const response = await Axios.get(url, {
          headers,
          timeout: CASHFREE_CONFIG.TIMEOUT,
        });

        if (response.status === 200 && response.data) {
          console.log(
            `✅ [verifyCashfreePayment] Order verification successful:`,
            response.data
          );
          return {
            verification_success: true,
            order_status: response.data.order_status,
            order_amount: response.data.order_amount,
            order_currency: response.data.order_currency,
            payments: response.data.payments,
            verification_time: new Date().toISOString(),
            verification_method: "orders_api",
            raw_response: response.data,
          };
        }
      } catch (orderError) {
        console.log(
          `⚠️ [verifyCashfreePayment] Order endpoint failed:`,
          orderError.message
        );

        // SECOND ATTEMPT: Try payments endpoint
        try {
          const paymentsUrl = `${CASHFREE_CONFIG.BASE_URL}/orders/${orderID}/payments`;
          const headers = {
            "Content-Type": "application/json",
            "x-api-version": CASHFREE_CONFIG.API_VERSION,
            "x-client-id": CASHFREE_CONFIG.CLIENT_ID,
            "x-client-secret": CASHFREE_CONFIG.CLIENT_SECRET,
          };

          const paymentsResponse = await Axios.get(paymentsUrl, {
            headers,
            timeout: CASHFREE_CONFIG.TIMEOUT,
          });

          if (paymentsResponse.status === 200 && paymentsResponse.data) {
            console.log(
              `✅ [verifyCashfreePayment] Payments verification successful:`,
              paymentsResponse.data
            );

            // Check if any payment was successful
            const payments = paymentsResponse.data;
            const successfulPayment = Array.isArray(payments)
              ? payments.find((p) => p.payment_status === "SUCCESS")
              : null;

            if (successfulPayment) {
              return {
                verification_success: true,
                order_status: "PAID",
                order_amount: successfulPayment.payment_amount,
                payment_method: successfulPayment.payment_method,
                verification_time: new Date().toISOString(),
                verification_method: "payments_api",
                raw_response: paymentsResponse.data,
              };
            }
          }
        } catch (paymentsError) {
          console.log(
            `⚠️ [verifyCashfreePayment] Payments endpoint failed:`,
            paymentsError.message
          );
        }
      }

      // THIRD ATTEMPT: Try order status endpoint as fallback
      try {
        const statusUrl = `${CASHFREE_CONFIG.BASE_URL}/orders/${orderID}/status`;
        const headers = {
          "Content-Type": "application/json",
          "x-api-version": CASHFREE_CONFIG.API_VERSION,
          "x-client-id": CASHFREE_CONFIG.CLIENT_ID,
          "x-client-secret": CASHFREE_CONFIG.CLIENT_SECRET,
        };

        const statusResponse = await Axios.get(statusUrl, {
          headers,
          timeout: CASHFREE_CONFIG.TIMEOUT,
        });

        if (statusResponse.status === 200 && statusResponse.data) {
          console.log(
            `✅ [verifyCashfreePayment] Status verification successful:`,
            statusResponse.data
          );
          return {
            verification_success: true,
            order_status: statusResponse.data.order_status,
            verification_time: new Date().toISOString(),
            verification_method: "status_api",
            raw_response: statusResponse.data,
          };
        }
      } catch (statusError) {
        console.log(
          `⚠️ [verifyCashfreePayment] Status endpoint failed:`,
          statusError.message
        );
      }

      // If we're here, all three methods failed, throw an error to trigger retry
      throw new Error("All verification methods failed");
    } catch (error) {
      // Log error details
      const errorDetails = error.response?.data || {
        code: error.code || "NETWORK_ERROR",
        message: error.message || "Unknown error",
        type: "request_failed",
      };

      console.error(
        `❌ [verifyCashfreePayment] Attempt ${attempt + 1} failed:`,
        errorDetails
      );

      // If it's the last attempt, return detailed error
      if (attempt === MAX_RETRIES - 1) {
        return {
          verification_failed: true,
          error_code: errorDetails.code || "VERIFICATION_FAILED",
          error_message: errorDetails.message || "Payment verification failed",
          http_status: error.response?.status || 500,
          verification_time: new Date().toISOString(),
          retry_count: attempt,
          is_retryable_error: errorDetails.code === "order_not_found",
          max_retries_reached: true,
        };
      }

      // Wait before retrying
      const delay = RETRY_DELAYS[attempt];
      console.log(
        `⏳ [verifyCashfreePayment] ${
          errorDetails.code || "Error"
        }, retrying after ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Create Cashfree order
const createCFOrderNew = async (parameter) => {
  console.log("📦 [createCFOrderNew] Creating Cashfree order:", parameter);

  const config = {
    headers: {
      "x-client-id": CASHFREE_CONFIG.CLIENT_ID,
      "x-client-secret": CASHFREE_CONFIG.CLIENT_SECRET,
      "x-request-id": `REQ_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      "x-api-version": CASHFREE_CONFIG.API_VERSION,
      "Content-Type": "application/json",
    },
    timeout: CASHFREE_CONFIG.TIMEOUT,
  };

  const jsonData = {
    order_id: parameter.rechargeID.toString(),
    order_currency: "INR",
    order_amount: parameter.amount.toString(),
    customer_details: {
      customer_id: parameter.userID.toString(),
      customer_name: parameter.name.toString(),
      customer_email: parameter.email.toString(),
      customer_phone: parameter.phone.toString(),
    },
    order_meta: {
      return_url: "https://yourapp.com/payment-return?order_id={order_id}",
      notify_url:
        "https://lv3utnblyk.execute-api.ap-south-1.amazonaws.com/Stage/manageRecharge",
    },
    order_note: `Wallet recharge for user ${parameter.userID}`,
    order_tags: {
      userID: parameter.userID.toString(),
      packageID: parameter.packageID || "",
      source: "mobile_app",
    },
  };

  const apiUrl = `${CASHFREE_CONFIG.BASE_URL}/orders`;

  try {
    console.log(
      "📤 [createCFOrderNew] Sending request to Cashfree:",
      JSON.stringify(jsonData, null, 2)
    );

    const response = await Axios.post(apiUrl, jsonData, config);

    const cfResponse = {
      statusCode: response.status,
      payment_session_id: response.data.payment_session_id,
      cf_order_id: response.data.cf_order_id,
      order_id: response.data.order_id,
    };

    console.log(
      "✅ [createCFOrderNew] Cashfree order created successfully:",
      cfResponse
    );
    return cfResponse;
  } catch (error) {
    const errorData = {
      statusCode: error.response?.status || 500,
      errorMessage: error.response?.data?.message || error.message,
      errorCode: error.response?.data?.code || "UNKNOWN_ERROR",
      errorType: error.response?.data?.type || "API_ERROR",
      error: error.response?.data || error.message,
      timestamp: new Date().toISOString(),
    };

    console.error(
      "❌ [createCFOrderNew] Cashfree order creation failed:",
      errorData
    );
    return errorData;
  }
};

// ========================================
// MAIN SERVICE FUNCTION
// ========================================

exports.manageRecharge = async (parameter) => {
  console.log(
    "🚀 [manageRecharge] Called with parameter:",
    JSON.stringify(parameter, null, 2)
  );

  try {
    // Test database connection first
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.error("❌ [manageRecharge] Database connection failed");
      return createResponse(500, null, "Database connection failed");
    }

    // Check rate limiting (except for webhooks)
    if (!parameter.isWebhook && parameter.type === "init") {
      const rateLimitOk = await checkRateLimit(parameter.userID);
      if (!rateLimitOk) {
        return createResponse(
          429,
          null,
          "Too many payment attempts. Please try again later."
        );
      }
    }

    // Handle webhooks differently if flagged
    if (parameter.isWebhook) {
      console.log("🔧 [manageRecharge] Handling webhook data");

      // Verify webhook signature if available
      if (parameter.signature && CASHFREE_CONFIG.WEBHOOK_SECRET) {
        const isValidSignature = verifyWebhookSignature(
          JSON.stringify(parameter),
          parameter.signature,
          CASHFREE_CONFIG.WEBHOOK_SECRET
        );

        if (!isValidSignature) {
          console.error("🚨 [Webhook] Invalid signature detected");
          return createResponse(400, null, "Invalid webhook signature");
        }
      }

      // Get current recharge details to know current status
      const currentRecharge = await getRechargeDetails(
        parameter.rechargeID,
        parameter.userID
      );
      if (!currentRecharge) {
        return createResponse(
          404,
          null,
          "Recharge record not found for webhook"
        );
      }

      // Check for duplicate processing
      if (currentRecharge.R_STATUS === parameter.status) {
        console.log(
          "✅ [Webhook] Status already updated, skipping duplicate processing"
        );
        return createResponse(200, null, "Webhook already processed");
      }

      // Log webhook receipt
      await logAuditTrail({
        userID: parameter.userID,
        rechargeID: parameter.rechargeID,
        orderID: parameter.cfOrderID,
        action: AUDIT_ACTIONS.WEBHOOK_RECEIVED,
        oldStatus: currentRecharge.R_STATUS,
        newStatus:
          parameter.status === "SUCCESS"
            ? PAYMENT_STATUSES.SUCCESS
            : PAYMENT_STATUSES.FAILED,
        amount: parameter.amount,
        details: {
          requestId: parameter.requestId,
          ipAddress: parameter.ipAddress,
          userAgent: parameter.userAgent,
          status: parameter.status,
          raw: parameter.cfNotes,
        },
      });

      // For webhooks, we trust the status - update directly
      if (parameter.status === "SUCCESS") {
        // Check for duplicate successful transaction
        const duplicateCheck = await checkDuplicateTransaction(
          parameter.cfOrderID,
          parameter.userID
        );
        if (duplicateCheck) {
          console.log(
            "✅ [Webhook] Duplicate successful transaction detected, skipping"
          );
          return createResponse(200, null, "Transaction already processed");
        }

        // Update recharge status
        const updateResult = await updateRecharge({
          ...parameter,
          status: "SUCCESS",
          cfNotes: JSON.stringify({
            verification_status: "WEBHOOK_VERIFIED",
            client_reported_status: parameter.status,
            verification_time: new Date().toISOString(),
            webhook_data: JSON.parse(parameter.cfNotes || "{}"),
            reason: "Payment SUCCESS - confirmed by webhook",
          }),
        });

        // Log success
        await logAuditTrail({
          userID: parameter.userID,
          rechargeID: parameter.rechargeID,
          orderID: parameter.cfOrderID,
          action: AUDIT_ACTIONS.PAYMENT_COMPLETED,
          oldStatus: currentRecharge.R_STATUS,
          newStatus: PAYMENT_STATUSES.SUCCESS,
          amount: parameter.amount,
          details: {
            requestId: parameter.requestId,
            ipAddress: parameter.ipAddress,
            userAgent: parameter.userAgent,
            reason: "Payment SUCCESS - confirmed by webhook",
          },
        });

        // Add money to wallet only if status changed to SUCCESS
        if (currentRecharge.R_STATUS !== "SUCCESS") {
          const txnResult = await insertIntoConTransaction(parameter);
          console.log(
            "✅ [manageRecharge] insertIntoConTransaction result:",
            txnResult
          );

          // Handle package subscription if applicable
          if (parameter.packageID) {
            const pkgResult = await insertIntoSubPkg(parameter);
            console.log(
              "✅ [manageRecharge] insertIntoSubPkg result:",
              pkgResult
            );
          }
        }

        return createResponse(
          200,
          null,
          "Webhook processed - payment confirmed successful"
        );
      } else {
        // Update recharge with failure status from webhook
        await updateRecharge({
          ...parameter,
          status: "FAILED",
          cfNotes: JSON.stringify({
            verification_status: "WEBHOOK_VERIFIED",
            client_reported_status: parameter.status,
            verification_time: new Date().toISOString(),
            webhook_data: JSON.parse(parameter.cfNotes || "{}"),
            reason: "Payment FAILED - confirmed by webhook",
          }),
        });

        // Log failure
        await logAuditTrail({
          userID: parameter.userID,
          rechargeID: parameter.rechargeID,
          orderID: parameter.cfOrderID,
          action: AUDIT_ACTIONS.PAYMENT_FAILED,
          oldStatus: currentRecharge.R_STATUS,
          newStatus: PAYMENT_STATUSES.FAILED,
          amount: parameter.amount,
          details: {
            requestId: parameter.requestId,
            ipAddress: parameter.ipAddress,
            userAgent: parameter.userAgent,
            reason: "Payment FAILED - confirmed by webhook",
          },
        });

        return createResponse(
          200,
          null,
          "Webhook processed - payment confirmed failed"
        );
      }
    }

    // Handle initial payment request
    if (parameter.type === "init") {
      console.log("🔧 [manageRecharge] Handling INIT type");

      // Validate amount
      if (!parameter.amount || parameter.amount <= 0) {
        return createResponse(400, null, "Invalid amount");
      }

      if (parameter.amount > 100000) {
        return createResponse(400, null, "Amount exceeds maximum limit");
      }

      // Log payment initiation
      await logAuditTrail({
        userID: parameter.userID,
        rechargeID: null,
        orderID: null,
        action: AUDIT_ACTIONS.PAYMENT_STARTED,
        oldStatus: "UNKNOWN",
        newStatus: PAYMENT_STATUSES.INIT,
        amount: parameter.amount,
        details: {
          requestId: parameter.requestId,
          ipAddress: parameter.ipAddress,
          userAgent: parameter.userAgent,
        },
      });

      // Insert recharge record
      console.log("📝 [manageRecharge] Inserting recharge record...");
      const result = await insertIntoRecharge(parameter);
      console.log("✅ [manageRecharge] insertIntoRecharge result:", result);

      if (result && result[1] === 1) {
        parameter.rechargeID = result[0];
        console.log(
          "✅ [manageRecharge] Recharge record created with ID:",
          parameter.rechargeID
        );

        // Create Cashfree order
        console.log("🏦 [manageRecharge] Creating Cashfree order...");
        const cfResult = await createCFOrderNew(parameter);
        console.log("✅ [manageRecharge] createCFOrderNew result:", cfResult);

        if (
          cfResult &&
          (cfResult.statusCode === 200 || cfResult.statusCode === 201)
        ) {
          // Update recharge with CF order details
          console.log(
            "📝 [manageRecharge] Updating recharge with CF details..."
          );
          await updateRechargeWithCFDetails(
            parameter.rechargeID,
            cfResult.cf_order_id,
            "PROCESSING",
            parameter.userID
          );

          // Log payment gateway opened
          await logAuditTrail({
            userID: parameter.userID,
            rechargeID: parameter.rechargeID,
            orderID: cfResult.cf_order_id,
            action: AUDIT_ACTIONS.PAYMENT_GATEWAY_OPENED,
            oldStatus: PAYMENT_STATUSES.INIT,
            newStatus: PAYMENT_STATUSES.PROCESSING,
            amount: parameter.amount,
            details: {
              requestId: parameter.requestId,
              ipAddress: parameter.ipAddress,
              userAgent: parameter.userAgent,
            },
          });

          // Return success with payment session data
          console.log("🎯 [manageRecharge] Returning success response");
          return {
            status: "SUCCESS",
            statusCode: 200,
            message: "Payment session created successfully",
            payload: {
              payment_session_id: cfResult.payment_session_id,
              cf_order_id: cfResult.cf_order_id,
              rechargeID: result[0],
            },
          };
        } else {
          console.error(
            "❌ [manageRecharge] Cashfree order creation failed:",
            cfResult
          );

          // Log system error
          await logAuditTrail({
            userID: parameter.userID,
            rechargeID: parameter.rechargeID,
            orderID: null,
            action: AUDIT_ACTIONS.SYSTEM_ERROR,
            oldStatus: PAYMENT_STATUSES.INIT,
            newStatus: PAYMENT_STATUSES.FAILED,
            amount: parameter.amount,
            details: {
              requestId: parameter.requestId,
              ipAddress: parameter.ipAddress,
              userAgent: parameter.userAgent,
              reason: "Cashfree order creation failed",
            },
          });

          // Update recharge status to failed
          await updateRechargeStatus(
            parameter.rechargeID,
            "FAILED",
            JSON.stringify(cfResult),
            parameter.userID
          );

          return createResponse(
            500,
            null,
            "Payment initialization failed. Please try again."
          );
        }
      } else {
        console.error(
          "❌ [manageRecharge] Failed to create recharge record:",
          result
        );
        return createResponse(500, null, "Failed to create payment record");
      }
    }
    // Handle final payment verification
    else if (parameter.type === "final") {
      console.log(
        "🔧 [manageRecharge] Handling FINAL type with rechargeID:",
        parameter.rechargeID
      );

      if (!parameter.rechargeID) {
        console.warn(
          "⚠️ [manageRecharge] Missing rechargeID in final verification"
        );
        return createResponse(
          400,
          null,
          "Recharge ID is required for final verification"
        );
      }

      // Get current recharge details
      const currentRecharge = await getRechargeDetails(
        parameter.rechargeID,
        parameter.userID
      );
      if (!currentRecharge) {
        return createResponse(400, null, "Recharge record not found");
      }

      // Check if this transaction is already processed
      if (
        currentRecharge.R_STATUS === "SUCCESS" &&
        parameter.status === "SUCCESS"
      ) {
        console.log(
          "✅ [manageRecharge] Payment already marked as successful. Avoiding duplicate processing."
        );
        return createResponse(
          200,
          null,
          "Payment already processed successfully"
        );
      } else if (
        currentRecharge.R_STATUS === "FAILED" &&
        parameter.status === "FAILED"
      ) {
        console.log(
          "✅ [manageRecharge] Payment already marked as failed. Avoiding duplicate processing."
        );
        return createResponse(
          400,
          { status: "ALREADY_FAILED" },
          "Payment was already cancelled by user."
        );
      }

      // Check if webhook already reported success
      const hasWebhookSuccess = await checkWebhookSuccess(parameter.rechargeID);
      let finalStatus;
      let auditAction;
      let verificationNotes;

      if (hasWebhookSuccess) {
        console.log(
          "✅ [manageRecharge] Webhook already confirmed success, skipping verification"
        );
        finalStatus = "SUCCESS";
        auditAction = AUDIT_ACTIONS.PAYMENT_COMPLETED;
        verificationNotes = JSON.stringify({
          verification_status: "WEBHOOK_VERIFIED",
          client_reported_status: parameter.status,
          verification_time: new Date().toISOString(),
          reason: "Payment SUCCESS - confirmed by webhook",
        });
      } else {
        // Try Cashfree API verification
        let cfVerification = null;
        if (parameter.cfOrderID) {
          cfVerification = await verifyCashfreePayment(parameter.cfOrderID);
          console.log(
            "✅ [manageRecharge] Cashfree verification result:",
            cfVerification
          );
        }

        // SECURE PAYMENT VERIFICATION LOGIC
        if (cfVerification && cfVerification.verification_success) {
          // API verification succeeded - trust the API result
          if (cfVerification.order_status === "PAID") {
            finalStatus = "SUCCESS";
            auditAction = AUDIT_ACTIONS.PAYMENT_COMPLETED;
            verificationNotes = JSON.stringify({
              verification_status: "API_VERIFIED",
              api_status: cfVerification.order_status,
              verification_time: new Date().toISOString(),
              verification_method: cfVerification.verification_method,
              reason: "Payment SUCCESS - confirmed by Cashfree API",
            });
          } else {
            // API says not paid - trust API over client
            finalStatus = "FAILED";
            auditAction = AUDIT_ACTIONS.VERIFICATION_FAILED;
            verificationNotes = JSON.stringify({
              verification_status: "API_VERIFIED",
              api_status: cfVerification.order_status,
              client_reported: parameter.status,
              verification_time: new Date().toISOString(),
              reason: `API reports ${cfVerification.order_status} but client reported ${parameter.status}`,
            });
          }
        } else {
          // API verification failed - determine next steps based on client status
          if (parameter.status === "SUCCESS") {
            // SECURITY CRITICAL: Never trust client SUCCESS when API verification fails
            console.log(
              "🚨 [Security] Client reported SUCCESS but API verification failed - flagging for manual review"
            );

            finalStatus = "MANUAL_REVIEW";
            auditAction = AUDIT_ACTIONS.SECURITY_VIOLATION;
            verificationNotes = JSON.stringify({
              verification_status: "VERIFICATION_FAILED",
              client_reported_status: parameter.status,
              verification_time: new Date().toISOString(),
              api_error:
                cfVerification?.error_message || "API verification failed",
              security_flag: true,
              reason:
                "SECURITY: Client reported SUCCESS but API verification failed - flagged for manual review",
            });

            // Create manual review task
            await createManualReviewTask({
              orderID: parameter.cfOrderID,
              userID: parameter.userID,
              amount: parameter.amount,
              clientReportedStatus: parameter.status,
              apiVerificationError:
                cfVerification?.error_message || "API verification failed",
            });
          } else if (
            parameter.status === "FAILED" ||
            parameter.status === "CANCELLED"
          ) {
            // Trust client-reported failures (no incentive to lie about failure)
            finalStatus = "FAILED";
            auditAction = parameter.cfNotes?.includes("cancelled")
              ? AUDIT_ACTIONS.PAYMENT_CANCELLED
              : AUDIT_ACTIONS.PAYMENT_FAILED;
            verificationNotes = JSON.stringify({
              verification_status: "CLIENT_REPORTED_FAILURE",
              client_reported_status: parameter.status,
              verification_time: new Date().toISOString(),
              reason: "Payment failed - client report trusted for failures",
            });
          } else {
            // Unknown status - manual review
            finalStatus = "MANUAL_REVIEW";
            auditAction = AUDIT_ACTIONS.MANUAL_REVIEW_REQUIRED;
            verificationNotes = JSON.stringify({
              verification_status: "UNKNOWN_STATUS",
              client_reported_status: parameter.status,
              verification_time: new Date().toISOString(),
              reason: `Unknown payment status: ${parameter.status}`,
            });

            // Create manual review task
            await createManualReviewTask({
              orderID: parameter.cfOrderID,
              userID: parameter.userID,
              amount: parameter.amount,
              clientReportedStatus: parameter.status,
              apiVerificationError: "Unknown status received",
            });
          }
        }
      }

      // Update recharge record with final status
      const updateResult = await updateRecharge({
        ...parameter,
        status: finalStatus,
        cfNotes: verificationNotes || parameter.cfNotes,
      });

      if (updateResult && updateResult[1] === 1) {
        // Log final payment status
        await logAuditTrail({
          userID: parameter.userID,
          rechargeID: parameter.rechargeID,
          orderID: parameter.cfOrderID,
          action: auditAction,
          oldStatus: currentRecharge.R_STATUS,
          newStatus: finalStatus,
          amount: parameter.amount,
          details: {
            requestId: parameter.requestId,
            ipAddress: parameter.ipAddress,
            userAgent: parameter.userAgent,
            reason:
              JSON.parse(verificationNotes)?.reason || "Payment status updated",
          },
        });

        // Handle successful payment
        if (finalStatus === "SUCCESS") {
          // Check for duplicate transaction one more time
          const duplicateCheck = await checkDuplicateTransaction(
            parameter.cfOrderID,
            parameter.userID
          );
          if (duplicateCheck && duplicateCheck.R_ID !== parameter.rechargeID) {
            console.log(
              "🚨 [Security] Duplicate successful transaction detected for different recharge ID"
            );
            return createResponse(400, null, "Duplicate transaction detected");
          }

          // Add money to wallet
          const txnResult = await insertIntoConTransaction(parameter);
          console.log(
            "✅ [manageRecharge] insertIntoConTransaction result:",
            txnResult
          );

          if (txnResult && txnResult[1] === 1) {
            // Handle package subscription if applicable
            if (parameter.packageID) {
              const pkgResult = await insertIntoSubPkg(parameter);
              console.log(
                "✅ [manageRecharge] insertIntoSubPkg result:",
                pkgResult
              );
            }

            return createResponse(200, null, "Payment completed successfully");
          } else {
            return createResponse(
              500,
              null,
              "Payment verification successful but wallet update failed"
            );
          }
        }
        // Handle payment under review
        else if (finalStatus === "MANUAL_REVIEW") {
          return createResponse(
            202,
            {
              message:
                "Payment verification failed. Please contact support if money was debited.",
              rechargeID: parameter.rechargeID,
              status: "UNDER_REVIEW",
            },
            "Payment under manual review"
          );
        }
        // Handle payment failure
        else {
          return createResponse(400, null, "Payment was cancelled or failed.");
        }
      } else {
        return createResponse(500, null, "Failed to update payment record");
      }
    } else {
      console.warn(
        "⚠️ [manageRecharge] Invalid type received:",
        parameter.type
      );
      return createResponse(
        400,
        null,
        "Please send appropriate request type 'init' or 'final'"
      );
    }
  } catch (error) {
    console.error("🔥 [manageRecharge] Error occurred:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Log system error
    await logAuditTrail({
      userID: parameter.userID,
      rechargeID: parameter.rechargeID,
      orderID: parameter.cfOrderID,
      action: AUDIT_ACTIONS.SYSTEM_ERROR,
      oldStatus: "UNKNOWN",
      newStatus: PAYMENT_STATUSES.FAILED,
      amount: parameter.amount,
      details: {
        requestId: parameter.requestId,
        ipAddress: parameter.ipAddress,
        userAgent: parameter.userAgent,
        reason: error.message,
      },
    });

    // Log error details
    await logError({
      userID: parameter.userID,
      rechargeID: parameter.rechargeID,
      orderID: parameter.cfOrderID,
      amount: parameter.amount,
      error: error.message,
      errorType: "SYSTEM_ERROR",
      details: {
        stack: error.stack,
        requestId: parameter.requestId,
      },
    });

    return createResponse(
      500,
      null,
      error.message || "Payment processing failed. Please try again."
    );
  }
};

// ========================================
// DATABASE HELPER FUNCTIONS
// ========================================

const insertIntoRecharge = async (insertData) => {
  console.log("📝 [insertIntoRecharge] Inserting recharge record:", insertData);

  try {
    const query = `INSERT INTO TB_RECHARGE 
      (R_USERID, R_AMOUNT, R_DATE, R_STATUS, R_CFNOTES, R_REQUEST_ID, R_IP_ADDRESS, R_USER_AGENT) 
      VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`;

    const result = await sequelize.query(query, {
      replacements: [
        insertData.userID,
        insertData.amount,
        "INIT",
        insertData.cfNotes || "Payment initiated",
        insertData.requestId || null,
        insertData.ipAddress || null,
        insertData.userAgent || null,
      ],
      type: QueryTypes.INSERT,
    });

    console.log("✅ [insertIntoRecharge] Record created with ID:", result[0]);
    return result;
  } catch (error) {
    console.error("❌ [insertIntoRecharge] Database error:", error.message);
    throw error;
  }
};

const getRechargeDetails = async (rechargeID, userID) => {
  try {
    const query = `SELECT R_ID, R_USERID, R_AMOUNT, R_STATUS, R_CFID, R_DATE, R_CFNOTES 
         FROM TB_RECHARGE  
         WHERE R_ID = ? AND R_USERID = ?`;

    const result = await sequelize.query(query, {
      replacements: [rechargeID, userID],
      type: QueryTypes.SELECT,
    });

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("❌ [getRechargeDetails] Database error:", error.message);
    throw error;
  }
};

const updateRecharge = async (updateData) => {
  try {
    const query = `UPDATE TB_RECHARGE  
         SET R_STATUS = ?, R_CFID = ?, R_CFNOTES = ?, R_UPD_DATE = NOW() 
         WHERE R_ID = ? AND R_USERID = ?`;

    const result = await sequelize.query(query, {
      replacements: [
        updateData.status,
        updateData.cfOrderID || null,
        updateData.cfNotes || null,
        updateData.rechargeID,
        updateData.userID,
      ],
      type: QueryTypes.UPDATE,
    });

    console.log("✅ [updateRecharge] Records updated:", result[1]);
    return result;
  } catch (error) {
    console.error("❌ [updateRecharge] Database error:", error.message);
    throw error;
  }
};

const updateRechargeStatus = async (rechargeID, status, notes, userID) => {
  try {
    const query = `UPDATE TB_RECHARGE  
         SET R_STATUS = ?, R_CFNOTES = ?, R_UPD_DATE = NOW() 
         WHERE R_ID = ? AND R_USERID = ?`;

    return await sequelize.query(query, {
      replacements: [status, notes, rechargeID, userID],
      type: QueryTypes.UPDATE,
    });
  } catch (error) {
    console.error("❌ [updateRechargeStatus] Database error:", error.message);
    throw error;
  }
};

const updateRechargeWithCFDetails = async (
  rechargeID,
  cfOrderID,
  status,
  userID
) => {
  try {
    const query = `UPDATE TB_RECHARGE  
         SET R_CFID = ?, R_STATUS = ?, R_UPD_DATE = NOW() 
         WHERE R_ID = ? AND R_USERID = ?`;

    return await sequelize.query(query, {
      replacements: [cfOrderID, status, rechargeID, userID],
      type: QueryTypes.UPDATE,
    });
  } catch (error) {
    console.error(
      "❌ [updateRechargeWithCFDetails] Database error:",
      error.message
    );
    throw error;
  }
};

const insertIntoConTransaction = async (insertData) => {
  console.log("💰 [insertIntoConTransaction] Processing wallet transaction");

  try {
    // Get current balance
    const balanceResult = await getConsumerBalance(insertData.userID);
    let currentBal = 0;

    if (balanceResult.length > 0) {
      currentBal = parseInt(balanceResult[0].TR_BAL);
    }

    const newBalance = parseInt(currentBal) + parseInt(insertData.amount);

    const query = `INSERT INTO TB_CONS_TRANSACTION  
         (TR_USERID, TR_SRC_ID, TR_CREDIT, TR_DEBIT, TR_BAL, TR_CR_DATE, TR_REQUEST_ID) 
         VALUES (?, ?, ?, ?, ?, NOW(), ?)`;

    const result = await sequelize.query(query, {
      replacements: [
        insertData.userID,
        insertData.rechargeID,
        insertData.amount,
        0,
        newBalance,
        insertData.requestId || null,
      ],
      type: QueryTypes.INSERT,
    });

    console.log(
      "✅ [insertIntoConTransaction] Balance updated:",
      currentBal,
      "→",
      newBalance
    );
    return result;
  } catch (error) {
    console.error(
      "❌ [insertIntoConTransaction] Database error:",
      error.message
    );
    throw error;
  }
};

const insertIntoSubPkg = async (insertData) => {
  console.log("📦 [insertIntoSubPkg] Creating package subscription");

  try {
    const currentDate = new Date();
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + parseInt(insertData.packageVal));

    const query = `INSERT INTO TB_SUBS_PKG  
         (SP_USRID, SP_PKGID, SP_SUB_DATE, SP_END_DATE, SP_STATUS, SP_RECID, SP_REQUEST_ID) 
         VALUES (?, ?, NOW(), ?, ?, ?, ?)`;

    const result = await sequelize.query(query, {
      replacements: [
        insertData.userID,
        insertData.packageID,
        endDate.toISOString().slice(0, 19).replace("T", " "),
        "ACTIVE",
        insertData.rechargeID,
        insertData.requestId || null,
      ],
      type: QueryTypes.INSERT,
    });

    console.log("✅ [insertIntoSubPkg] Package subscription created");
    return result;
  } catch (error) {
    console.error("❌ [insertIntoSubPkg] Database error:", error.message);
    throw error;
  }
};

const getConsumerBalance = async (userID) => {
  try {
    const query = `SELECT TR_BAL, TR_CR_DATE 
         FROM TB_CONS_TRANSACTION 
         WHERE TR_USERID = ? 
         ORDER BY TR_ID DESC 
         LIMIT 1`;

    return await sequelize.query(query, {
      replacements: [userID],
      type: QueryTypes.SELECT,
    });
  } catch (error) {
    console.error("❌ [getConsumerBalance] Database error:", error.message);
    throw error;
  }
};
