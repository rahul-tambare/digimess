const db = require('../config/db');

// GET /api/vendor/bank-details
exports.getBankDetails = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM BankDetails WHERE vendorId = ?', [req.user.id]);
    res.json(rows[0] || null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/vendor/bank-details
exports.createBankDetails = async (req, res) => {
  try {
    const { bankName, accountNumber, accountHolderName, ifscCode, upiId } = req.body;
    if (!accountNumber || !accountHolderName || !ifscCode) {
      return res.status(400).json({ error: 'Account Number, Holder Name and IFSC are required' });
    }

    // Check if already exists
    const [existing] = await db.query('SELECT id FROM BankDetails WHERE vendorId = ?', [req.user.id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Bank details already exist. Use PUT to update.' });
    }

    const id = require('crypto').randomUUID();
    await db.query(
      `INSERT INTO BankDetails (id, vendorId, bankName, accountNumber, accountHolderName, ifscCode, upiId)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, bankName || 'N/A', accountNumber, accountHolderName, ifscCode, upiId || null]
    );

    res.status(201).json({ message: 'Bank details saved successfully', id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/vendor/bank-details
exports.updateBankDetails = async (req, res) => {
  try {
    const { bankName, accountNumber, accountHolderName, ifscCode, upiId } = req.body;

    const [existing] = await db.query('SELECT id FROM BankDetails WHERE vendorId = ?', [req.user.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'No bank details found. Use POST to create.' });
    }

    await db.query(
      `UPDATE BankDetails SET
        bankName = COALESCE(?, bankName),
        accountNumber = COALESCE(?, accountNumber),
        accountHolderName = COALESCE(?, accountHolderName),
        ifscCode = COALESCE(?, ifscCode),
        upiId = COALESCE(?, upiId)
       WHERE vendorId = ?`,
      [bankName, accountNumber, accountHolderName, ifscCode, upiId, req.user.id]
    );

    res.json({ message: 'Bank details updated successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
