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
       WHERE o.customerId = ? AND o.isDeleted = 0
       ORDER BY o.createdAt DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/orders/provider/my-orders — get orders for provider's messes
exports.getProviderOrders = async (req, res) => {
  try {
     const [rows] = await db.query(
       `SELECT o.*, 
               u.name AS customerName, u.phone AS customerPhone,
               m.name AS messName 
        FROM Orders o
        JOIN Messes m ON o.messId = m.id
        JOIN Users u ON o.customerId = u.id
        WHERE m.vendorId = ? AND o.isDeleted = 0
        ORDER BY o.createdAt DESC`,
       [req.user.id]
     );
     res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/orders/provider/forecast — Dashboard overview of required meals today
exports.getKitchenForecast = async (req, res) => {
  try {
    const providerId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // 1. Calculate Active Subscriptions for today (not paused)
    const [subscriptions] = await db.query(
      `SELECT COUNT(s.id) as totalActiveSubs 
       FROM Subscriptions s
       JOIN Messes m ON s.messId = m.id
       WHERE m.vendorId = ? 
         AND s.isActive = 1 
         AND s.mealsRemaining > 0 
         AND s.startDate <= ? 
         AND s.endDate >= ? 
         AND (s.pauseStartDate IS NULL OR s.pauseStartDate > ? OR s.pauseEndDate < ?)`,
      [providerId, today, today, today, today]
    );

    // 2. Calculate Today's On-Demand Orders
    const [orders] = await db.query(
      `SELECT COUNT(o.id) as totalPendingOrders
       FROM Orders o
       JOIN Messes m ON o.messId = m.id
       WHERE m.vendorId = ? 
         AND o.status IN ('pending', 'confirmed', 'preparing')
         AND DATE(o.createdAt) = ?`,
      [providerId, today]
    );

    res.json({
      message: 'Kitchen Forecast for ' + today,
      data: {
        activeSubscriptionsToday: subscriptions[0].totalActiveSubs,
        pendingOnDemandOrders: orders[0].totalPendingOrders,
        totalMealsToPrepare: subscriptions[0].totalActiveSubs + orders[0].totalPendingOrders
      }
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error calculating forecast' });
  }
};

// PATCH /api/orders/:id/status — update status (vendor/admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    // Verify ownership if role is vendor
    if (req.user && req.user.role === 'vendor') {
      const [orderCheck] = await db.query(
        'SELECT o.id, o.customerId FROM Orders o JOIN Messes m ON o.messId = m.id WHERE o.id = ? AND m.vendorId = ?',
        [orderId, req.user.id]
      );
      if (orderCheck.length === 0) {
        return res.status(403).json({ error: 'Unauthorized to update this order' });
      }

      await db.query('UPDATE Orders SET status = ? WHERE id = ?', [status, orderId]);
      
      // Send Push Notification securely
      const customerId = orderCheck[0].customerId;
      const { sendPushNotification } = require('./notificationController');
      await sendPushNotification(customerId, 'Order Update', `Your order #${orderId.slice(0,6)} is now ${status}.`, { orderId, status });
    } else {
      await db.query('UPDATE Orders SET status = ? WHERE id = ?', [status, orderId]);
    }

    res.json({ message: 'Order status updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
