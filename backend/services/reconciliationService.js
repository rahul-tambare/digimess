/**
 * Reconciliation Service — Gateway ↔ DB matching + ledger integrity checks.
 */

const db = require('../config/db');
const crypto = require('crypto');
const { getRazorpayInstance } = require('../utils/razorpayClient');

/**
 * Run daily reconciliation — match gateway transactions with internal records.
 * @param {Date} [date] - Date to reconcile (defaults to yesterday)
 * @returns {Promise<object>} Reconciliation report data
 */
async function runReconciliation(date) {
  const reportDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dateStr = reportDate.toISOString().split('T')[0];

  const report = {
    reportDate: dateStr,
    totalGateway: 0,
    totalInternal: 0,
    matchedCount: 0,
    mismatchedCount: 0,
    discrepancies: [],
  };

  try {
    // 1. Get internal payment sessions for the date
    const [internalTxns] = await db.query(
      `SELECT id, gatewayOrderId, gatewayPaymentId, amount, status, type
       FROM PaymentSessions
       WHERE DATE(createdAt) = ? AND status = 'success'`,
      [dateStr]
    );

    report.totalInternal = internalTxns.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // 2. Try to fetch Razorpay transactions (if SDK is available)
    const razorpay = getRazorpayInstance();
    if (razorpay) {
      try {
        const from = Math.floor(new Date(`${dateStr}T00:00:00Z`).getTime() / 1000);
        const to = Math.floor(new Date(`${dateStr}T23:59:59Z`).getTime() / 1000);

        const payments = await razorpay.payments.all({
          from,
          to,
          count: 100,
        });

        const gatewayPayments = payments.items || [];
        report.totalGateway = gatewayPayments.reduce((sum, p) => sum + (p.amount / 100), 0);

        // 3. Match by gateway payment ID
        const internalMap = new Map();
        internalTxns.forEach(t => {
          if (t.gatewayPaymentId) {
            internalMap.set(t.gatewayPaymentId, t);
          }
        });

        for (const gp of gatewayPayments) {
          if (gp.status !== 'captured') continue;

          const internal = internalMap.get(gp.id);
          if (internal) {
            const internalAmount = parseFloat(internal.amount);
            const gatewayAmount = gp.amount / 100;

            if (Math.abs(internalAmount - gatewayAmount) < 0.01) {
              report.matchedCount++;
            } else {
              report.mismatchedCount++;
              report.discrepancies.push({
                type: 'AMOUNT_MISMATCH',
                gatewayId: gp.id,
                internalId: internal.id,
                gatewayAmount,
                internalAmount,
              });
            }
            internalMap.delete(gp.id);
          } else {
            report.mismatchedCount++;
            report.discrepancies.push({
              type: 'MISSING_INTERNAL',
              gatewayId: gp.id,
              gatewayAmount: gp.amount / 100,
              message: 'Payment in gateway but not in DB (missed webhook)',
            });
          }
        }

        // Check for internal records not in gateway
        for (const [paymentId, internal] of internalMap) {
          report.mismatchedCount++;
          report.discrepancies.push({
            type: 'MISSING_GATEWAY',
            internalId: internal.id,
            gatewayPaymentId: paymentId,
            internalAmount: parseFloat(internal.amount),
            message: 'Payment in DB but not in gateway (phantom)',
          });
        }
      } catch (e) {
        report.discrepancies.push({
          type: 'GATEWAY_ERROR',
          message: `Could not fetch Razorpay transactions: ${e.message}`,
        });
      }
    } else {
      report.discrepancies.push({
        type: 'GATEWAY_UNAVAILABLE',
        message: 'Razorpay SDK not configured — skipping gateway reconciliation',
      });
      // Just count internal as matched
      report.matchedCount = internalTxns.length;
    }

    // 4. Internal ledger integrity check
    const [unbalanced] = await db.query(`
      SELECT transactionId,
             SUM(CASE WHEN entryType='DEBIT' THEN amount ELSE 0 END) AS totalDebits,
             SUM(CASE WHEN entryType='CREDIT' THEN amount ELSE 0 END) AS totalCredits
      FROM LedgerEntries
      WHERE DATE(createdAt) = ?
      GROUP BY transactionId
      HAVING ABS(totalDebits - totalCredits) > 0.01`,
      [dateStr]
    );

    if (unbalanced.length > 0) {
      for (const u of unbalanced) {
        report.discrepancies.push({
          type: 'LEDGER_IMBALANCE',
          transactionId: u.transactionId,
          totalDebits: parseFloat(u.totalDebits),
          totalCredits: parseFloat(u.totalCredits),
        });
      }
      report.mismatchedCount += unbalanced.length;
    }

    // 5. Check escrow balance is non-negative
    const [escrowRows] = await db.query(
      "SELECT id FROM LedgerAccounts WHERE accountType = 'PLATFORM_ESCROW' LIMIT 1"
    );
    if (escrowRows.length > 0) {
      const [balRows] = await db.query(
        `SELECT
           (COALESCE(SUM(CASE WHEN entryType='CREDIT' THEN amount ELSE 0 END), 0)
          - COALESCE(SUM(CASE WHEN entryType='DEBIT' THEN amount ELSE 0 END), 0)) AS balance
         FROM LedgerEntries WHERE accountId = ?`,
        [escrowRows[0].id]
      );
      const escrowBalance = parseFloat(balRows[0].balance) || 0;
      if (escrowBalance < 0) {
        report.discrepancies.push({
          type: 'NEGATIVE_ESCROW',
          balance: escrowBalance,
          message: 'Platform escrow has negative balance — requires investigation',
        });
      }
    }

    // 6. Save report
    const reportId = crypto.randomUUID();
    await db.query(`
      INSERT INTO ReconciliationReports (id, reportDate, totalGateway, totalInternal, matchedCount, mismatchedCount, discrepancies, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'GENERATED')
      ON DUPLICATE KEY UPDATE totalGateway = VALUES(totalGateway), totalInternal = VALUES(totalInternal),
        matchedCount = VALUES(matchedCount), mismatchedCount = VALUES(mismatchedCount), discrepancies = VALUES(discrepancies)`,
      [reportId, dateStr, report.totalGateway, report.totalInternal, report.matchedCount, report.mismatchedCount, JSON.stringify(report.discrepancies)]
    );

    report.id = reportId;
    return report;
  } catch (error) {
    console.error('[Reconciliation] Error:', error);
    throw error;
  }
}

module.exports = { runReconciliation };
