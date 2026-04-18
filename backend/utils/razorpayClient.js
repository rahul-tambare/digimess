/**
 * Razorpay SDK client initialization.
 * - Standard Razorpay: for payment collection (orders, refunds)
 * - RazorpayX: for vendor payouts (contacts, fund accounts, payouts)
 *
 * Returns null gracefully if env vars are missing (development mode).
 */

let Razorpay;
try {
  Razorpay = require('razorpay');
} catch {
  console.warn('[RazorpayClient] razorpay package not installed. Payment features will be unavailable.');
}

let razorpayInstance = null;

/**
 * Get the Razorpay SDK instance (standard — for collections).
 * @returns {import('razorpay')|null}
 */
function getRazorpayInstance() {
  if (razorpayInstance) return razorpayInstance;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn('[RazorpayClient] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set. Razorpay payments disabled.');
    return null;
  }

  if (!Razorpay) return null;

  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  console.log('[RazorpayClient] Razorpay SDK initialized successfully.');
  return razorpayInstance;
}

/**
 * Get the Razorpay webhook secret for signature verification.
 * @returns {string|null}
 */
function getWebhookSecret() {
  return process.env.RAZORPAY_WEBHOOK_SECRET || null;
}

/**
 * Get the Razorpay key ID (safe to expose to client-side).
 * @returns {string|null}
 */
function getKeyId() {
  return process.env.RAZORPAY_KEY_ID || null;
}

/**
 * Get RazorpayX API credentials for payout operations.
 * Uses separate env vars: RAZORPAYX_KEY_ID, RAZORPAYX_KEY_SECRET
 * Falls back to standard Razorpay keys if X-specific keys are not set.
 * @returns {{ keyId: string, keySecret: string }|null}
 */
function getRazorpayXCredentials() {
  const keyId = process.env.RAZORPAYX_KEY_ID || process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAYX_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn('[RazorpayClient] RazorpayX credentials not set. Payouts disabled.');
    return null;
  }

  return { keyId, keySecret };
}

module.exports = {
  getRazorpayInstance,
  getWebhookSecret,
  getKeyId,
  getRazorpayXCredentials,
};
