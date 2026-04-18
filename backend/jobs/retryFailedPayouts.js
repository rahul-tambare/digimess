/**
 * Retry Failed Payouts Job — Exponential backoff retry for failed settlements.
 *
 * Formula: delay = 60000 * 2^retryCount + random(0, 5000) ms
 * After max retries → stays FAILED, admin notification.
 *
 * Usage: node jobs/retryFailedPayouts.js
 */

const db = require('../config/db');
const settlementService = require('../services/settlementService');
const { sendPushNotification } = require('../controllers/notificationController');

async function retryFailedPayouts() {
  console.log(`[RetryPayouts] Starting at ${new Date().toISOString()}`);

  try {
    const [failedSettlements] = await db.query(
      "SELECT id, vendorId, retryCount, maxRetries, lastRetryAt FROM Settlements WHERE status = 'FAILED' AND retryCount < maxRetries"
    );

    console.log(`[RetryPayouts] Found ${failedSettlements.length} settlements to retry`);

    for (const settlement of failedSettlements) {
      // Check if enough time has passed (exponential backoff)
      if (settlement.lastRetryAt) {
        const delay = 60000 * Math.pow(2, settlement.retryCount) + Math.random() * 5000;
        const nextRetryTime = new Date(settlement.lastRetryAt).getTime() + delay;
        if (Date.now() < nextRetryTime) {
          console.log(`[RetryPayouts] Skipping ${settlement.id} — too soon for retry`);
          continue;
        }
      }

      console.log(`[RetryPayouts] Retrying settlement ${settlement.id} (attempt ${settlement.retryCount + 1}/${settlement.maxRetries})`);
      const result = await settlementService.retrySettlement(settlement.id);

      if (!result.success) {
        console.error(`[RetryPayouts] Retry failed for ${settlement.id}: ${result.message}`);

        // If max retries reached after this attempt, notify admin
        if (settlement.retryCount + 1 >= settlement.maxRetries) {
          console.error(`[RetryPayouts] Max retries reached for settlement ${settlement.id}`);
          // Try to notify admins (best effort)
          try {
            const [admins] = await db.query('SELECT id FROM AdminUsers WHERE isActive = 1 LIMIT 3');
            for (const admin of admins) {
              await sendPushNotification(
                admin.id,
                'Settlement Failed',
                `Settlement #${settlement.id.slice(0, 8)} for vendor failed after ${settlement.maxRetries} retries. Manual intervention required.`,
                { type: 'settlement_failed', settlementId: settlement.id }
              );
            }
          } catch {
            // Notification failure is non-critical
          }
        }
      } else {
        console.log(`[RetryPayouts] Successfully retried ${settlement.id}`);
      }
    }
  } catch (error) {
    console.error('[RetryPayouts] Fatal error:', error);
  }

  process.exit(0);
}

if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
  retryFailedPayouts();
}

module.exports = { retryFailedPayouts };
