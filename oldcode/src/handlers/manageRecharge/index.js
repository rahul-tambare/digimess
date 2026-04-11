const { manageRecharge } = require("./service");
const {
  sequelize,
  QueryTypes,
} = require("common-layer/utils/SequelizeWriteConnection");

// ========================================
// LAMBDA HANDLER
// ========================================

// Parse form-urlencoded data (used for Cashfree webhooks)
const parseFormUrlEncoded = (str) => {
  if (!str) return {};

  const result = {};
  const pairs = str.split("&");

  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key) {
      result[key] = decodeURIComponent(value || "");
    }
  }

  return result;
};

// Get userID from rechargeID/orderID
async function getUserIdFromOrderId(orderId) {
  try {
    const query = `SELECT R_USERID FROM TB_RECHARGE WHERE R_ID = ?`;
    const result = await sequelize.query(query, {
      replacements: [orderId],
      type: QueryTypes.SELECT,
    });

    if (result && result.length > 0) {
      return result[0].R_USERID;
    }

    // Default fallback if not found
    console.log(`⚠️ [getUserIdFromOrderId] No user found for order ${orderId}`);
    return null;
  } catch (error) {
    console.error(`❌ [getUserIdFromOrderId] Error: ${error.message}`);
    return null;
  }
}

// Process Cashfree webhook
async function processWebhook(webhookData, corsHeaders) {
  try {
    console.log(
      "🔔 [Webhook] Processing data:",
      JSON.stringify(webhookData, null, 2)
    );

    // Extract order ID and get user ID
    const orderId = webhookData.orderId;
    if (!orderId) {
      console.error("❌ [Webhook] Missing orderId in webhook data");
      return {
        statusCode: 200, // Still return 200 to acknowledge receipt
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Webhook missing orderId",
          status: "ERROR",
        }),
      };
    }

    // Get user ID from database
    const userID = await getUserIdFromOrderId(orderId);
    if (!userID) {
      console.error(`❌ [Webhook] Could not find userID for order ${orderId}`);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: `Webhook received for unknown order ${orderId}`,
          status: "ERROR",
        }),
      };
    }

    // Convert webhook data to our internal format
    const finalPaymentRequest = {
      userID: userID,
      amount: parseFloat(webhookData.orderAmount || 0),
      status: webhookData.txStatus === "SUCCESS" ? "SUCCESS" : "FAILED",
      type: "final",
      cfNotes: JSON.stringify(webhookData),
      cfOrderID: webhookData.referenceId || webhookData.orderId,
      rechargeID: orderId,
      requestId: `WEBHOOK_${Date.now()}`,
      ipAddress: "webhook",
      userAgent: "cashfree-webhook",
      isWebhook: true, // Flag to indicate this is from webhook
    };

    console.log(
      "🔔 [Webhook] Processing as payment:",
      JSON.stringify(finalPaymentRequest, null, 2)
    );

    // Call manageRecharge with the converted data
    const result = await manageRecharge(finalPaymentRequest);
    console.log(
      "🔔 [Webhook] Processing result:",
      JSON.stringify(result, null, 2)
    );

    // Always return 200 for webhooks to acknowledge receipt
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Webhook processed successfully",
        status: "SUCCESS",
        orderId: orderId,
      }),
    };
  } catch (error) {
    console.error("❌ [Webhook] Processing error:", error);
    // Still return 200 to prevent Cashfree from retrying
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Webhook received but processing failed",
        error: error.message,
      }),
    };
  }
}

// Main Lambda handler
exports.handler = async (event, context) => {
  console.log("🚀 [Handler] Starting request processing...");

  // Enable CORS for all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,authorizationtoken",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Content-Type": "application/json",
  };

  try {
    // Handle preflight OPTIONS request
    if (event.httpMethod === "OPTIONS") {
      console.log("🔧 [Handler] Handling OPTIONS preflight request");
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "CORS preflight successful" }),
      };
    }

    // Log incoming request details
    console.log("📥 [Handler] Event body:", event.body);
    console.log(
      "📥 [Handler] Event headers:",
      JSON.stringify(event.headers, null, 2)
    );

    // Validate HTTP method
    if (event.httpMethod !== "POST") {
      console.error("❌ [Handler] Invalid HTTP method:", event.httpMethod);
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Method Not Allowed",
          message: "Only POST requests are supported",
        }),
      };
    }

    // Detect if this is a Cashfree webhook
    const contentType =
      event.headers["Content-Type"] || event.headers["content-type"] || "";
    const isFormUrlEncoded = contentType.includes(
      "application/x-www-form-urlencoded"
    );
    const isWebhook =
      isFormUrlEncoded ||
      (event.body &&
        typeof event.body === "string" &&
        (event.body.includes("orderId=") ||
          event.body.includes("txStatus="))) ||
      event.headers["X-Webhook-Attempt"] ||
      event.headers["x-webhook-attempt"];

    // Handle webhook requests
    if (isWebhook) {
      console.log("🔔 [Handler] Detected Cashfree webhook");
      try {
        const webhookData = parseFormUrlEncoded(event.body);
        console.log(
          "✅ [Handler] Parsed webhook data:",
          JSON.stringify(webhookData, null, 2)
        );

        // Process webhook and return response
        return await processWebhook(webhookData, corsHeaders);
      } catch (webhookError) {
        console.error(
          "❌ [Handler] Failed to process webhook:",
          webhookError.message
        );
        return {
          statusCode: 200, // Still return 200 to acknowledge receipt
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Webhook parsing failed",
            error: webhookError.message,
          }),
        };
      }
    }

    // For regular JSON requests
    let requestBody;
    try {
      requestBody =
        typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      console.log(
        "✅ [Handler] Successfully parsed request body:",
        JSON.stringify(requestBody, null, 2)
      );
    } catch (parseError) {
      console.error(
        "❌ [Handler] Failed to parse request body:",
        parseError.message
      );
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
      };
    }

    // Extract client info for tracking
    const clientIP =
      event.headers["x-forwarded-for"] ||
      event.headers["X-Forwarded-For"] ||
      event.requestContext?.identity?.sourceIp ||
      "unknown";

    const userAgent =
      event.headers["user-agent"] || event.headers["User-Agent"] || "unknown";

    // Generate unique request ID for tracking
    const requestId = `REQ_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Add tracking information to request
    const enhancedRequestBody = {
      ...requestBody,
      requestId: requestId,
      ipAddress: clientIP.split(",")[0].trim(), // Get first IP if multiple
      userAgent: userAgent,
    };

    console.log("🔍 [Handler] Added tracking info:", {
      requestId: requestId,
      ipAddress: enhancedRequestBody.ipAddress,
      userAgent: enhancedRequestBody.userAgent,
    });

    // Validate required fields
    console.log("🔍 [Handler] Starting validation...");
    const validationResult = validateRequest(enhancedRequestBody);
    if (!validationResult.isValid) {
      console.error("❌ [Handler] Validation failed:", validationResult.errors);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Validation Error",
          message: "Request validation failed",
          details: validationResult.errors,
        }),
      };
    }
    console.log("✅ [Handler] Validation successful");

    // Log processed request info
    console.log("📋 [Handler] Processing payment request:", {
      userId: enhancedRequestBody.userID,
      amount: enhancedRequestBody.amount,
      type: enhancedRequestBody.type,
      requestId: requestId,
    });

    // Call the main service
    console.log("🔧 [Handler] Calling service.manageRecharge...");
    const serviceResponse = await manageRecharge(enhancedRequestBody);

    console.log(
      "✅ [Handler] Service response received:",
      JSON.stringify(serviceResponse, null, 2)
    );

    // Determine HTTP status code based on service response
    let httpStatusCode = 500; // Default error

    if (serviceResponse?.statusCode) {
      httpStatusCode = serviceResponse.statusCode;
    } else if (serviceResponse?.success === true) {
      httpStatusCode = 200;
    } else if (serviceResponse?.status === "SUCCESS") {
      httpStatusCode = 200;
    }

    // Determine if this is a success or error response
    const isSuccess = httpStatusCode >= 200 && httpStatusCode < 300;
    console.log(
      `${isSuccess ? "✅" : "❌"} [Handler] ${
        isSuccess ? "Success" : "Error"
      } response detected`
    );

    // Return response
    console.log("🎯 [Handler] Returning response with status:", httpStatusCode);
    return {
      statusCode: httpStatusCode,
      headers: corsHeaders,
      body: JSON.stringify(serviceResponse),
    };
  } catch (error) {
    console.error("🔥 [Handler] Unexpected error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Return error response
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while processing the payment",
        timestamp: new Date().toISOString(),
        requestId: event.requestId || "unknown",
      }),
    };
  }
};

// ========================================
// VALIDATION FUNCTIONS
// ========================================

const validateRequest = (requestBody) => {
  const errors = [];

  // Check for required fields
  if (!requestBody.userID) {
    errors.push("userID is required");
  }

  if (!requestBody.type) {
    errors.push("type is required");
  } else if (!["init", "final"].includes(requestBody.type)) {
    errors.push('type must be either "init" or "final"');
  }

  // Validate based on request type
  if (requestBody.type === "init") {
    // Validation for init requests
    if (!requestBody.amount || requestBody.amount <= 0) {
      errors.push("amount must be greater than 0 for init requests");
    }

    if (requestBody.amount > 100000) {
      errors.push("amount cannot exceed ₹100,000");
    }
  } else if (requestBody.type === "final") {
    // Validation for final requests
    if (!requestBody.rechargeID) {
      errors.push("rechargeID is required for final requests");
    }

    if (!requestBody.status) {
      errors.push("status is required for final requests");
    }
  }

  // Validate userID format (assuming it should be numeric)
  if (requestBody.userID && !/^\d+$/.test(requestBody.userID.toString())) {
    errors.push("userID must be numeric");
  }

  // Validate amount format if present
  if (requestBody.amount !== undefined) {
    const amount = Number(requestBody.amount);
    if (isNaN(amount) || amount < 0) {
      errors.push("amount must be a valid positive number");
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

// Export for testing
module.exports = {
  handler: exports.handler,
  validateRequest,
};
