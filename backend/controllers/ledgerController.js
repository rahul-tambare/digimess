/**
 * Ledger Controller — Admin ledger queries.
 */

const ledgerService = require('../services/ledgerService');

/**
 * GET /api/admin/ledger/accounts
 * List ledger accounts with balances.
 */
exports.listAccounts = async (req, res) => {
  try {
    const result = await ledgerService.listAccounts({
      accountType: req.query.type || undefined,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (e) {
    console.error('List accounts error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/admin/ledger/accounts/:id
 * Account balance + entries.
 */
exports.getAccountDetail = async (req, res) => {
  try {
    const balance = await ledgerService.getBalance(req.params.id);
    const entries = await ledgerService.getEntries(req.params.id, {
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json({ balance, ...entries });
  } catch (e) {
    console.error('Get account detail error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
