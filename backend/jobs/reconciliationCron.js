/**
 * Reconciliation Cron Job — Daily reconciliation runner.
 *
 * Usage: node jobs/reconciliationCron.js
 */

const reconciliationService = require('../services/reconciliationService');

async function runReconciliationCron() {
  console.log(`[ReconciliationCron] Starting at ${new Date().toISOString()}`);

  try {
    const report = await reconciliationService.runReconciliation();
    console.log(`[ReconciliationCron] Report for ${report.reportDate}:`);
    console.log(`  - Matched: ${report.matchedCount}`);
    console.log(`  - Mismatched: ${report.mismatchedCount}`);
    console.log(`  - Gateway total: ₹${report.totalGateway}`);
    console.log(`  - Internal total: ₹${report.totalInternal}`);

    if (report.discrepancies.length > 0) {
      console.warn(`  - Discrepancies:`, JSON.stringify(report.discrepancies, null, 2));
    }
  } catch (error) {
    console.error('[ReconciliationCron] Fatal error:', error);
  }

  process.exit(0);
}

if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
  runReconciliationCron();
}

module.exports = { runReconciliationCron };
