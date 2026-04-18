/**
 * Webhook Signature Verifier Middleware.
 * Verifies Razorpay and RazorpayX webhook signatures using HMAC-SHA256.
 *
 * NOTE: Webhook routes must use express.raw() for body parsing —
 * the signature is computed over the raw body bytes.
 */

const crypto = require('crypto');
const { getWebhookSecret } = require('../utils/razorpayClient');

/**
 * Middleware: verify Razorpay webhook signature.
 * Expects raw body (Buffer) in req.body.
 */
function verifyRazorpayWebhook(req, res, next) {
  try {
    const webhookSecret = getWebhookSecret();
    if (!webhookSecret) {
      console.error('[WebhookVerifier] RAZORPAY_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      console.warn('[WebhookVerifier] Missing x-razorpay-signature header');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // req.body should be a Buffer (from express.raw())
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('[WebhookVerifier] Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Parse the raw body into JSON for downstream handlers
    if (Buffer.isBuffer(req.body)) {
      req.body = JSON.parse(req.body.toString('utf8'));
    }

    next();
  } catch (error) {
    console.error('[WebhookVerifier] Error:', error.message);
    res.status(400).json({ error: 'Webhook verification failed' });
  }
}

module.exports = { verifyRazorpayWebhook };
