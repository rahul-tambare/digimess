const db = require('../config/db');

// POST /api/orders — place an order (deducts from wallet)
exports.placeOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { messId, totalAmount, orderType, items } = req.body;
    
    await connection.beginTransaction();

    // 1. Check for Active Subscription first
    // We prioritize specific-mess subscriptions (messId matches) over bundles/universal ones
    const [subRows] = await connection.query(
      `SELECT id, mealsRemaining FROM Subscriptions 
       WHERE customerId = ? 
         AND isActive = 1 
         AND mealsRemaining > 0 
         AND (
           messId = ? 
           OR (messId IS NULL AND JSON_CONTAINS(allowedMesses, JSON_QUOTE(?)))
           OR (messId IS NULL AND allowedMesses IS NULL)
         )
       ORDER BY messId DESC FOR UPDATE`,
      [req.user.id, messId, messId]
    );

    let isSubscriptionOrder = false;
    let amount = parseFloat(totalAmount);

    if (subRows.length > 0) {
      // Use subscription meal
      isSubscriptionOrder = true;
      amount = 0; // No cost for this order
      const subId = subRows[0].id;
      
      // Deduct 1 meal
      await connection.query(
        'UPDATE Subscriptions SET mealsRemaining = mealsRemaining - 1 WHERE id = ?',
        [subId]
      );
    } else {
      // 2. Fallback: Check Wallet Balance
      const [userRows] = await connection.query('SELECT walletBalance FROM Users WHERE id = ? FOR UPDATE', [req.user.id]);
      const balance = parseFloat(userRows[0].walletBalance);

      if (balance < amount) {
        await connection.rollback();
        return res.status(400).json({ error: 'Insufficient wallet balance or no active subscription', shortfall: amount - balance });
      }

      // 3. Deduct Wallet
      await connection.query('UPDATE Users SET walletBalance = walletBalance - ? WHERE id = ?', [amount, req.user.id]);

      // 4. Log Wallet Transaction
      const txId = require('crypto').randomUUID();
      const description = `Order placed${messId ? ' at mess' : ''}`;
      await connection.query(
        'INSERT INTO WalletTransactions (id, userId, amount, type, description) VALUES (?, ?, ?, ?, ?)',
        [txId, req.user.id, amount, 'debit', description]
      );
    }

    // Ensure valid messId for the order
    let finalMessId = messId;
    if (!finalMessId || finalMessId === 'default-mess-id') {
      const [messes] = await connection.query('SELECT id FROM Messes LIMIT 1');
      if (messes.length > 0) {
        finalMessId = messes[0].id;
      }
    }

    // 5. Create Order
    const orderId = require('crypto').randomUUID();
    await connection.query(
      'INSERT INTO Orders (id, customerId, messId, totalAmount, orderType, items) VALUES (?, ?, ?, ?, ?, ?)',
      [orderId, req.user.id, finalMessId, amount, isSubscriptionOrder ? 'subscription' : (orderType || 'on_demand'), JSON.stringify(items || [])]
    );

    await connection.commit();
    res.status(201).json({ 
      message: isSubscriptionOrder ? 'Order placed using subscription' : 'Order placed successfully', 
      orderId,
      usedSubscription: isSubscriptionOrder
    });
  } catch (e) {
    await connection.rollback();
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// GET /api/orders — get customer's orders
exports.getMyOrders = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.*, m.name AS messName, m.images AS messImages
       FROM Orders o
       JOIN Messes m ON o.messId = m.id
       WHERE o.customerId = ?
       ORDER BY o.createdAt DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /api/orders/:id/status — update status (vendor/admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await db.query('UPDATE Orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Order status updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
