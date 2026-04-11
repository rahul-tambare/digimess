const db = require('../config/db');

// POST /api/user/subscriptions
exports.subscribe = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { planId, amount, messId } = req.body;
    
    await connection.beginTransaction();

    // 1. Check Wallet Balance
    const [userRows] = await connection.query('SELECT walletBalance FROM Users WHERE id = ? FOR UPDATE', [req.user.id]);
    const balance = parseFloat(userRows[0].walletBalance);
    const planAmount = parseFloat(amount);

    if (balance < planAmount) {
      await connection.rollback();
      return res.status(400).json({ error: 'Insufficient wallet balance', shortfall: planAmount - balance });
    }

    // 2. Deduct Wallet
    await connection.query('UPDATE Users SET walletBalance = walletBalance - ? WHERE id = ?', [planAmount, req.user.id]);

    // 3. Log Wallet Transaction
    const txId = require('crypto').randomUUID();
    await connection.query(
      'INSERT INTO WalletTransactions (id, userId, amount, type, description) VALUES (?, ?, ?, ?, ?)',
      [txId, req.user.id, planAmount, 'debit', 'Subscription purchased']
    );

    // 4. Create Subscription Entry
    const subId = require('crypto').randomUUID();
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); // 1 month default

    const { allowedMesses } = req.body;

    await connection.query(
      'INSERT INTO Subscriptions (id, customerId, messId, type, startDate, endDate, mealsRemaining, allowedMesses) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        subId, 
        req.user.id, 
        messId || null, 
        allowedMesses ? 'multi_mess' : 'single_mess', 
        startDate, 
        endDate, 
        req.body.mealsCount || 30,
        allowedMesses ? JSON.stringify(allowedMesses) : null
      ]
    );

    await connection.commit();
    res.status(201).json({ message: 'Subscription successful', subscriptionId: subId });
  } catch (e) {
    await connection.rollback();
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// GET /api/user/subscriptions
exports.getMySubscriptions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, m.name AS messName, m.images AS messImages
       FROM Subscriptions s
       LEFT JOIN Messes m ON s.messId = m.id
       WHERE s.customerId = ?
       ORDER BY s.createdAt DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/subscriptions/:id/pause
exports.pauseSubscription = async (req, res) => {
  try {
    const subId = req.params.id;
    const { pauseStartDate, pauseEndDate } = req.body; // YYYY-MM-DD
    
    // Validate ownership
    const [sub] = await db.query('SELECT * FROM Subscriptions WHERE id = ? AND customerId = ? AND isActive = 1', [subId, req.user.id]);
    if (sub.length === 0) return res.status(403).json({ error: 'Subscription not found or inactive' });
    
    // We can allow users to pause if they aren't already paused
    await db.query('UPDATE Subscriptions SET pauseStartDate = ?, pauseEndDate = ? WHERE id = ?', [pauseStartDate, pauseEndDate, subId]);
    res.json({ message: 'Subscription paused successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error pausing subscription' });
  }
};

// POST /api/user/subscriptions/:id/resume
exports.resumeSubscription = async (req, res) => {
  try {
    const subId = req.params.id;
    
    const [subRows] = await db.query('SELECT * FROM Subscriptions WHERE id = ? AND customerId = ? AND isActive = 1', [subId, req.user.id]);
    if (subRows.length === 0) return res.status(403).json({ error: 'Subscription not found or inactive' });
    
    const sub = subRows[0];
    if (sub.pauseStartDate && sub.pauseEndDate) {
      // Calculate how many days were actually paused up to today, and extend endDate
      const today = new Date();
      const pauseStart = new Date(sub.pauseStartDate);
      let daysPaused = 0;
      
      if (today > pauseStart) {
         // Pause started in the past, calculate paused days
         const pauseEnd = today > new Date(sub.pauseEndDate) ? new Date(sub.pauseEndDate) : today;
         daysPaused = Math.ceil((pauseEnd.getTime() - pauseStart.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      // Update the endDate to add the days paused
      const newEndDate = new Date(sub.endDate);
      newEndDate.setDate(newEndDate.getDate() + daysPaused);
      
      await db.query(
        'UPDATE Subscriptions SET pauseStartDate = NULL, pauseEndDate = NULL, endDate = ? WHERE id = ?', 
        [newEndDate, subId]
      );
    }
    
    res.json({ message: 'Subscription resumed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error resuming subscription' });
  }
};
