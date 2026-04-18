const db = require('../config/db');
const crypto = require('crypto');

// POST /api/user/subscriptions
exports.subscribe = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { planId, messId, allowedMesses, startDate: reqStartDate } = req.body;
    
    if (!planId) {
      return res.status(400).json({ error: 'planId is required' });
    }

    await connection.beginTransaction();

    // Look up the plan to get price and meals count
    const [planRows] = await connection.query('SELECT * FROM SubscriptionPlans WHERE id = ? AND isActive = 1', [planId]);
    if (planRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Subscription plan not found or inactive' });
    }
    const plan = planRows[0];
    const planAmount = parseFloat(plan.price);
    const mealsCount = plan.mealsCount || 30;

    // 1. Check Wallet Balance
    const [userRows] = await connection.query('SELECT walletBalance FROM Users WHERE id = ? FOR UPDATE', [req.user.id]);
    const balance = parseFloat(userRows[0].walletBalance);

    if (balance < planAmount) {
      await connection.rollback();
      return res.status(400).json({ error: 'Insufficient wallet balance', shortfall: planAmount - balance });
    }

    // Bug fix #10: Prevent duplicate active subscriptions
    const [existingSubs] = await connection.query(
      `SELECT id FROM Subscriptions 
       WHERE customerId = ? AND isActive = 1 AND endDate >= CURDATE()
       AND (messId = ? OR (messId IS NULL AND ? IS NULL))
       AND planId = ?`,
      [req.user.id, messId || null, messId || null, planId]
    );
    if (existingSubs.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'You already have an active subscription for this plan. Wait for it to expire or cancel it first.' });
    }

    // 2. Deduct Wallet
    await connection.query('UPDATE Users SET walletBalance = walletBalance - ? WHERE id = ?', [planAmount, req.user.id]);

    // 3. Log Wallet Transaction
    const txId = crypto.randomUUID();
    await connection.query(
      'INSERT INTO WalletTransactions (id, userId, amount, type, description) VALUES (?, ?, ?, ?, ?)',
      [txId, req.user.id, planAmount, 'debit', `Subscription: ${plan.name}`]
    );

    // 4. Create Subscription Entry
    const subId = crypto.randomUUID();
    const startDate = reqStartDate ? new Date(reqStartDate) : new Date();
    const endDate = new Date(startDate);
    // Bug fix #11: Add ~40% buffer to account for weekends/skips
    // e.g. 30 meals → 42 calendar days instead of 30
    const calendarDays = Math.ceil(mealsCount * 1.4);
    endDate.setDate(endDate.getDate() + calendarDays);

    await connection.query(
      `INSERT INTO Subscriptions (id, customerId, messId, planId, type, startDate, endDate, mealsRemaining, totalMeals, allowedMesses) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subId, 
        req.user.id, 
        messId || null,
        planId,
        allowedMesses ? 'multi_mess' : 'single_mess', 
        startDate, 
        endDate, 
        mealsCount,
        mealsCount,
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
      `SELECT s.*, m.name AS messName, m.images AS messImages,
              p.name AS planName, p.price AS planPrice, p.benefits AS planBenefits
       FROM Subscriptions s
       LEFT JOIN Messes m ON s.messId = m.id
       LEFT JOIN SubscriptionPlans p ON s.planId = p.id
       WHERE s.customerId = ?
       ORDER BY s.createdAt DESC`,
      [req.user.id]
    );
    // Parse benefits JSON for each row
    rows.forEach(row => {
      if (typeof row.planBenefits === 'string') {
        try { row.planBenefits = JSON.parse(row.planBenefits); } catch { row.planBenefits = []; }
      }
    });
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
    const { pauseStartDate, pauseEndDate } = req.body;
    
    // Validate ownership
    const [sub] = await db.query('SELECT * FROM Subscriptions WHERE id = ? AND customerId = ? AND isActive = 1', [subId, req.user.id]);
    if (sub.length === 0) return res.status(403).json({ error: 'Subscription not found or inactive' });

    // Already paused?
    if (sub[0].pauseStartDate) {
      return res.status(400).json({ error: 'Subscription is already paused' });
    }
    
    // Default pauseStartDate to today if not provided
    const effectivePauseStart = pauseStartDate || new Date().toISOString().split('T')[0];
    
    await db.query('UPDATE Subscriptions SET pauseStartDate = ?, pauseEndDate = ? WHERE id = ?', [effectivePauseStart, pauseEndDate || null, subId]);
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
    } else if (sub.pauseStartDate) {
      // Paused with no end date — calculate from pause start to today
      const today = new Date();
      const pauseStart = new Date(sub.pauseStartDate);
      const daysPaused = Math.max(0, Math.ceil((today.getTime() - pauseStart.getTime()) / (1000 * 60 * 60 * 24)));
      
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

// POST /api/user/subscriptions/:id/cancel
exports.cancelSubscription = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const subId = req.params.id;
    
    await connection.beginTransaction();

    const [subRows] = await connection.query(
      'SELECT * FROM Subscriptions WHERE id = ? AND customerId = ? AND isActive = 1 FOR UPDATE',
      [subId, req.user.id]
    );
    if (subRows.length === 0) {
      await connection.rollback();
      return res.status(403).json({ error: 'Subscription not found or inactive' });
    }
    
    const sub = subRows[0];
    
    // Calculate prorated refund based on remaining meals
    // Bug fix #12: Subtract skipped dates (skips didn't reduce mealsRemaining)
    let refundAmount = 0;
    if (sub.planId && sub.mealsRemaining > 0 && sub.totalMeals > 0) {
      const [planRows] = await connection.query('SELECT price FROM SubscriptionPlans WHERE id = ?', [sub.planId]);
      const [skipRows] = await connection.query('SELECT COUNT(*) as skipCount FROM SubscriptionSkips WHERE subscriptionId = ?', [subId]);
      const skipCount = skipRows[0].skipCount || 0;
      
      if (planRows.length > 0) {
        const planPrice = parseFloat(planRows[0].price);
        // Effective remaining = mealsRemaining minus skipped days (skips weren't deducted)
        const effectiveRemaining = Math.max(0, sub.mealsRemaining - skipCount);
        refundAmount = Math.round((planPrice * effectiveRemaining / sub.totalMeals) * 100) / 100;
      }
    }
    
    // Deactivate subscription
    await connection.query('UPDATE Subscriptions SET isActive = 0 WHERE id = ?', [subId]);
    
    // Refund to wallet if applicable
    if (refundAmount > 0) {
      await connection.query('UPDATE Users SET walletBalance = walletBalance + ? WHERE id = ?', [refundAmount, req.user.id]);
      
      const txId = crypto.randomUUID();
      await connection.query(
        'INSERT INTO WalletTransactions (id, userId, amount, type, description) VALUES (?, ?, ?, ?, ?)',
        [txId, req.user.id, refundAmount, 'credit', 'Subscription cancellation refund']
      );
    }
    
    await connection.commit();
    res.json({ message: 'Subscription cancelled', refundAmount });
  } catch (e) {
    await connection.rollback();
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// GET /api/user/subscriptions/:id/skips
exports.getSkippedDates = async (req, res) => {
  try {
    const subId = req.params.id;
    
    // Validate ownership
    const [sub] = await db.query('SELECT id FROM Subscriptions WHERE id = ? AND customerId = ?', [subId, req.user.id]);
    if (sub.length === 0) return res.status(403).json({ error: 'Subscription not found' });
    
    const [rows] = await db.query(
      'SELECT skipDate FROM SubscriptionSkips WHERE subscriptionId = ? ORDER BY skipDate ASC',
      [subId]
    );
    res.json(rows.map(r => r.skipDate));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/user/provider/subscriptions
exports.getProviderSubscriptions = async (req, res) => {
  try {
    const providerId = req.user.id;
    const [rows] = await db.query(
      `SELECT s.*, 
              u.name AS customerName, u.phone AS customerPhone,
              m.name AS messName 
       FROM Subscriptions s
       JOIN Users u ON s.customerId = u.id
       JOIN Messes m ON s.messId = m.id
       WHERE m.vendorId = ?
       ORDER BY s.createdAt DESC`,
      [providerId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/subscriptions/:id/skip — skip a meal date
exports.skipDate = async (req, res) => {
  try {
    const subId = req.params.id;
    const { date } = req.body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Valid date in YYYY-MM-DD format is required' });
    }

    // Validate ownership
    const [sub] = await db.query(
      'SELECT * FROM Subscriptions WHERE id = ? AND customerId = ? AND isActive = 1',
      [subId, req.user.id]
    );
    if (sub.length === 0) return res.status(403).json({ error: 'Subscription not found or inactive' });

    // Check date is within subscription period
    const skipDate = new Date(date);
    const startDate = new Date(sub[0].startDate);
    const endDate = new Date(sub[0].endDate);
    if (skipDate < startDate || skipDate > endDate) {
      return res.status(400).json({ error: 'Skip date must be within subscription period' });
    }

    // Insert skip (unique constraint will prevent duplicates)
    try {
      const skipId = require('crypto').randomUUID();
      await db.query(
        'INSERT INTO SubscriptionSkips (id, subscriptionId, skipDate) VALUES (?, ?, ?)',
        [skipId, subId, date]
      );
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.json({ message: 'This date is already skipped' });
      }
      throw e;
    }

    res.json({ message: `Meal skipped for ${date}` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
