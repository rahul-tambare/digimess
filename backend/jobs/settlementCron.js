/**
 * Settlement Cron Job — Scheduled settlement trigger.
 *
 * Usage: node jobs/settlementCron.js
 * Or integrate with system cron / pm2 / node-cron.
 *
 * Default: runs once and exits. For scheduled runs, wrap with node-cron or system crontab.
 */

const settlementService = require('../services/settlementService');

async function runSettlementCron() {
  console.log(`[SettlementCron] Starting at ${new Date().toISOString()}`);

  try {
    const results = await settlementService.triggerSettlements('SYSTEM');
    console.log(`[SettlementCron] Complete: created=${results.created}, skipped=${results.skipped}, errors=${results.errors.length}`);

    if (results.errors.length > 0) {
      console.error('[SettlementCron] Errors:', results.errors);
    }
  } catch (error) {
    console.error('[SettlementCron] Fatal error:', error);
  }

  // Exit after completion (for cron use)
  process.exit(0);
}

// Run if executed directly
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
  runSettlementCron();
}

module.exports = { runSettlementCron };
