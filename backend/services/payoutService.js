/**
 * Payout Service — RazorpayX integration for vendor payouts.
 * Uses RazorpayX API (REST) to create contacts, fund accounts, and initiate payouts.
 */

const { getRazorpayXCredentials } = require('../utils/razorpayClient');
const { rupeesToPaise } = require('../utils/money');

/**
 * Make a RazorpayX API request.
 * @param {string} endpoint - API path (e.g. '/contacts')
 * @param {string} method - HTTP method
 * @param {object} [body] - Request body
 * @returns {Promise<object>}
 */
async function razorpayXRequest(endpoint, method = 'GET', body = null) {
  const creds = getRazorpayXCredentials();
  if (!creds) throw new Error('RazorpayX credentials not configured');

  const url = `https://api.razorpay.com/v1${endpoint}`;
  const auth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');

  const options = {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`RazorpayX API error: ${JSON.stringify(data)}`);
  }

  return data;
}

/**
 * Create a RazorpayX Contact for a vendor.
 * @param {object} vendor - { id, name, email, phone }
 * @returns {Promise<string>} contactId
 */
async function createContact(vendor) {
  const data = await razorpayXRequest('/contacts', 'POST', {
    name: vendor.name,
    email: vendor.email || undefined,
    contact: vendor.phone || undefined,
    type: 'vendor',
    reference_id: vendor.id,
    notes: { vendorId: vendor.id },
  });
  return data.id;
}

/**
 * Create a RazorpayX Fund Account for a vendor using their bank details.
 * @param {string} contactId - RazorpayX contact ID
 * @param {object} bankDetails - { accountNumber, ifscCode, accountHolderName }
 * @returns {Promise<string>} fundAccountId
 */
async function createFundAccount(contactId, bankDetails) {
  const data = await razorpayXRequest('/fund_accounts', 'POST', {
    contact_id: contactId,
    account_type: 'bank_account',
    bank_account: {
      name: bankDetails.accountHolderName,
      ifsc: bankDetails.ifscCode,
      account_number: bankDetails.accountNumber,
    },
  });
  return data.id;
}

/**
 * Initiate a payout to a vendor.
 * @param {object} params
 * @param {string} params.fundAccountId - RazorpayX fund account ID
 * @param {number} params.amount - Amount in INR (rupees)
 * @param {string} params.settlementId - Digimess settlement ID (used as idempotency key)
 * @param {string} params.narration - Payout description
 * @returns {Promise<{ payoutId: string, status: string }>}
 */
async function initiatePayout(params) {
  const { fundAccountId, amount, settlementId, narration } = params;

  const data = await razorpayXRequest('/payouts', 'POST', {
    account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
    fund_account_id: fundAccountId,
    amount: rupeesToPaise(amount),
    currency: 'INR',
    mode: 'NEFT',
    purpose: 'payout',
    queue_if_low_balance: true,
    reference_id: settlementId,
    narration: narration || `Digimess settlement ${settlementId.slice(0, 8)}`,
    notes: { settlementId },
  });

  return {
    payoutId: data.id,
    status: data.status,
  };
}

module.exports = {
  createContact,
  createFundAccount,
  initiatePayout,
};
