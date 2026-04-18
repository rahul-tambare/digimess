/**
 * Safe monetary arithmetic utilities for Digimess.
 * All amounts are in INR, stored as DECIMAL(10,2) in MySQL.
 * These helpers prevent floating-point precision errors.
 */

/**
 * Round a number to 2 decimal places (paise precision).
 * @param {number} amount
 * @returns {number}
 */
function roundToPaise(amount) {
  return Math.round((parseFloat(amount) || 0) * 100) / 100;
}

/**
 * Safely add two monetary amounts.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function safeAdd(a, b) {
  return roundToPaise((parseFloat(a) || 0) + (parseFloat(b) || 0));
}

/**
 * Safely subtract two monetary amounts.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function safeSubtract(a, b) {
  return roundToPaise((parseFloat(a) || 0) - (parseFloat(b) || 0));
}

/**
 * Safely multiply a monetary amount by a factor.
 * @param {number} amount
 * @param {number} factor
 * @returns {number}
 */
function safeMultiply(amount, factor) {
  return roundToPaise((parseFloat(amount) || 0) * (parseFloat(factor) || 0));
}

/**
 * Calculate commission from an order amount using AdminCharges config.
 * Supports both fixed and percentage-based charges.
 * @param {number} orderAmount - Total order amount
 * @param {{ type: 'fixed'|'percentage', amount: number }} chargeConfig
 * @returns {{ commission: number, netAmount: number }}
 */
function calculateCommission(orderAmount, chargeConfig) {
  const amount = parseFloat(orderAmount) || 0;
  if (!chargeConfig || !chargeConfig.amount) {
    return { commission: 0, netAmount: roundToPaise(amount) };
  }

  let commission;
  if (chargeConfig.type === 'percentage') {
    commission = roundToPaise(amount * (parseFloat(chargeConfig.amount) / 100));
  } else {
    commission = roundToPaise(parseFloat(chargeConfig.amount));
  }

  // Commission cannot exceed the order amount
  commission = Math.min(commission, amount);

  return {
    commission,
    netAmount: safeSubtract(amount, commission),
  };
}

/**
 * Convert rupees to paise (integer) for Razorpay API.
 * Razorpay expects amounts in paise.
 * @param {number} rupees
 * @returns {number}
 */
function rupeesToPaise(rupees) {
  return Math.round((parseFloat(rupees) || 0) * 100);
}

/**
 * Convert paise to rupees.
 * @param {number} paise
 * @returns {number}
 */
function paiseToRupees(paise) {
  return roundToPaise((parseInt(paise) || 0) / 100);
}

module.exports = {
  roundToPaise,
  safeAdd,
  safeSubtract,
  safeMultiply,
  calculateCommission,
  rupeesToPaise,
  paiseToRupees,
};
