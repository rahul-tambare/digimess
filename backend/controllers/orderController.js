const db = require('../config/db');
const crypto = require('crypto');

// POST /api/orders — place an order (supports wallet, upi, card, cod, subscription)
exports.placeOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { messId, totalAmount, orderType, items, deliveryType, address, paymentMethod, specialNote } = req.body;
    
    if (!messId) {
      return res.status(400).json({ error: 'messId is required' });
    }

    await connection.beginTransaction();

    // Verify the requested mess is open and approved
    const [messCheckRows] = await connection.query(
      'SELECT isOpen, isApproved, isActive, businessStatus FROM Messes WHERE id = ? AND isDeleted = 0',
      [messId]
    );
    if (messCheckRows.length === 0 || !messCheckRows[0].isOpen || !messCheckRows[0].isApproved) {
      await connection.rollback();
      return res.status(400).json({ error: 'This mess is currently closed, unavailable, or unapproved.' });
    }

    // Calculate amount from items if totalAmount not provided
    let amount = totalAmount ? parseFloat(totalAmount) : 0;
    const parsedItems = Array.isArray(items) ? items : [];
    if (!amount && parsedItems.length > 0) {
      amount = parsedItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || item.qty || 1)), 0);
    }

    let isSubscriptionOrder = false;
    let usedSubscriptionId = null;
    let paymentStatus = 'pending'; // default
    let transactionDescription = `Order placed via ${paymentMethod === 'cod' ? 'Cash' : paymentMethod?.toUpperCase() || 'Wallet'}`;

    if (paymentMethod === 'subscription') {
      // ── Subscription payment ──
      // Bug fix: Also check subscription is NOT paused today
      const today = new Date().toISOString().split('T')[0];
      const [subRows] = await connection.query(
        `SELECT id, mealsRemaining FROM Subscriptions 
         WHERE customerId = ? 
           AND isActive = 1 
           AND mealsRemaining > 0 
           AND startDate <= CURDATE()
           AND endDate >= CURDATE()
           AND (
             messId = ? 
             OR (messId IS NULL AND JSON_CONTAINS(allowedMesses, JSON_QUOTE(?)))
             OR (messId IS NULL AND allowedMesses IS NULL)
           )
           AND (pauseStartDate IS NULL 
                OR CURDATE() < pauseStartDate 
                OR (pauseEndDate IS NOT NULL AND CURDATE() > pauseEndDate))
         ORDER BY messId DESC FOR UPDATE`,
        [req.user.id, messId, messId]
      );

      if (subRows.length > 0) {
        const matchedSubId = subRows[0].id;

        // Bug fix: Check if today is a skipped date for this subscription
        const [skipRows] = await connection.query(
          'SELECT id FROM SubscriptionSkips WHERE subscriptionId = ? AND skipDate = ?',
          [matchedSubId, today]
        );
        if (skipRows.length > 0) {
          await connection.rollback();
          return res.status(400).json({ error: 'Today is a skipped date for your subscription. You cannot place a subscription order today.' });
        }

        // Calculate subscription extra charges securely from items
        let extraSum = 0;
        let validSubscriptionItems = true;

        for (const item of parsedItems) {
           if (!item.thaliId) continue;
           const [thaliInfo] = await connection.query('SELECT isSubscriptionThali, subscriptionExtraCharge FROM Thalis WHERE id = ?', [item.thaliId]);
           if (thaliInfo.length > 0) {
              if (!thaliInfo[0].isSubscriptionThali) {
                 validSubscriptionItems = false;
                 break;
              }
              extraSum += (parseFloat(thaliInfo[0].subscriptionExtraCharge) || 0) * (item.quantity || item.qty || 1);
           }
        }
        
        if (!validSubscriptionItems) {
           await connection.rollback();
           return res.status(400).json({ error: 'Cart contains items not eligible for subscription' });
        }

        if (extraSum > 0) {
            const [userRows] = await connection.query('SELECT walletBalance FROM Users WHERE id = ? FOR UPDATE', [req.user.id]);
            const balance = parseFloat(userRows[0].walletBalance);
            if (balance < extraSum) {
                await connection.rollback();
                return res.status(400).json({ error: 'Insufficient wallet balance for subscription extra charges', shortfall: extraSum - balance });
            }
            await connection.query('UPDATE Users SET walletBalance = walletBalance - ? WHERE id = ?', [extraSum, req.user.id]);
        }

        isSubscriptionOrder = true;
        usedSubscriptionId = matchedSubId;
        amount = extraSum; // Pay the extra charge (0 if no extra charge)
        paymentStatus = 'paid';
        transactionDescription = 'Order placed via Subscription';
        await connection.query(
          'UPDATE Subscriptions SET mealsRemaining = mealsRemaining - 1 WHERE id = ?',
          [matchedSubId]
        );
      } else {
        await connection.rollback();
        return res.status(400).json({ error: 'No active subscription found for this mess (or subscription is paused/expired)' });
      }
    } else if (paymentMethod === 'wallet') {
      // ── Wallet payment — check balance and deduct ──
      const [userRows] = await connection.query('SELECT walletBalance FROM Users WHERE id = ? FOR UPDATE', [req.user.id]);
      const balance = parseFloat(userRows[0].walletBalance);

      if (balance < amount) {
        await connection.rollback();
        return res.status(400).json({ error: 'Insufficient wallet balance', shortfall: amount - balance });
      }

      await connection.query('UPDATE Users SET walletBalance = walletBalance - ? WHERE id = ?', [amount, req.user.id]);
      paymentStatus = 'paid';
    } else if (paymentMethod === 'upi' || paymentMethod === 'card') {
      // ── UPI / Card — no wallet deduction (simulated as paid) ──
      paymentStatus = 'paid';
    } else if (paymentMethod === 'cod') {
      // ── Cash on Delivery — payment collected later ──
      paymentStatus = 'pending';
    } else {
      // ── Unknown method — treat like COD (no wallet deduction) ──
      paymentStatus = 'pending';
    }

    // Record Transaction regardless of payment method
    if (!isSubscriptionOrder || amount > 0) {
       const txId = crypto.randomUUID();
       await connection.query(
         'INSERT INTO WalletTransactions (id, userId, amount, type, description) VALUES (?, ?, ?, ?, ?)',
         [txId, req.user.id, amount, 'debit', transactionDescription]
       );
    }

    // Create Order with all fields (Bug fix: include subscriptionId)
    const orderId = crypto.randomUUID();
    await connection.query(
      `INSERT INTO Orders (id, customerId, messId, totalAmount, orderType, items, deliveryType, deliveryAddress, paymentMethod, specialNote, subscriptionId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, req.user.id, messId, amount,
        isSubscriptionOrder ? 'subscription' : (orderType || 'on_demand'),
        JSON.stringify(parsedItems),
        deliveryType || null,
        address || null,
        paymentMethod || 'wallet',
        specialNote || null,
        usedSubscriptionId
      ]
    );

    // Record initial status in timeline
    await connection.query(
      'INSERT INTO OrderStatusTimeline (orderId, status, note) VALUES (?, ?, ?)',
      [orderId, 'pending', 'Order placed']
    );

    await connection.commit();
    res.status(201).json({ 
      message: isSubscriptionOrder ? 'Order placed using subscription' : 'Order placed successfully', 
      id: orderId,
      paymentStatus,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const filter = req.query.filter || 'All';

    let condition = 'o.customerId = ? AND o.isDeleted = 0';
    let queryParams = [req.user.id];

    if (filter === 'Subscriptions') {
      condition += ` AND o.orderType = 'subscription'`;
    } else if (filter === 'Delivered') {
      condition += ` AND o.status = 'delivered'`;
    } else if (filter === 'Cancelled') {
      condition += ` AND o.status IN ('cancelled', 'rejected')`;
    }

    const [rows] = await db.query(
      `SELECT o.*, m.name AS messName, m.images AS messImages
       FROM Orders o
       JOIN Messes m ON o.messId = m.id
       WHERE ${condition}
       ORDER BY o.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/orders/:id — get single order for consumer
exports.getOrderById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.*, m.name AS messName, m.images AS messImages
       FROM Orders o
       JOIN Messes m ON o.messId = m.id
       WHERE o.id = ? AND o.customerId = ? AND o.isDeleted = 0`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = rows[0];
    order.items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

    // Fetch status timeline
    const [timeline] = await db.query(
      'SELECT status, note, createdAt FROM OrderStatusTimeline WHERE orderId = ? ORDER BY createdAt ASC',
      [order.id]
    );
    order.statusTimeline = timeline;

    res.json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/orders/:id/reorder — re-place a previous order
exports.reorder = async (req, res) => {
  try {
    // Find the original order
    const [original] = await db.query(
      'SELECT messId, items, deliveryType, deliveryAddress, totalAmount, paymentMethod FROM Orders WHERE id = ? AND customerId = ? AND isDeleted = 0',
      [req.params.id, req.user.id]
    );
    if (original.length === 0) return res.status(404).json({ error: 'Original order not found' });

    const oldOrder = original[0];

    // Verify mess is still open
    const [messCheck] = await db.query(
      'SELECT isOpen, isApproved FROM Messes WHERE id = ? AND isDeleted = 0',
      [oldOrder.messId]
    );
    if (messCheck.length === 0 || !messCheck[0].isOpen || !messCheck[0].isApproved) {
      return res.status(400).json({ error: 'This mess is currently unavailable' });
    }

    // Delegate to placeOrder logic by injecting body
    req.body = {
      messId: oldOrder.messId,
      totalAmount: oldOrder.totalAmount,
      items: typeof oldOrder.items === 'string' ? JSON.parse(oldOrder.items) : oldOrder.items,
      deliveryType: oldOrder.deliveryType,
      address: oldOrder.deliveryAddress,
      paymentMethod: oldOrder.paymentMethod || 'wallet',
    };

    return exports.placeOrder(req, res);
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

    // Active subscriptions: not paused, not expired, meals remaining
    // Bug fix: proper NULL pauseEndDate handling (indefinite pause)
    const [subscriptions] = await db.query(
      `SELECT COUNT(s.id) as totalActiveSubs 
       FROM Subscriptions s
       JOIN Messes m ON s.messId = m.id
       WHERE m.vendorId = ? 
         AND s.isActive = 1 
         AND s.mealsRemaining > 0 
         AND s.startDate <= ? 
         AND s.endDate >= ? 
         AND (s.pauseStartDate IS NULL 
              OR ? < s.pauseStartDate 
              OR (s.pauseEndDate IS NOT NULL AND ? > s.pauseEndDate))`,
      [providerId, today, today, today, today]
    );

    // Bug fix: Subtract subscriptions that have skipped today
    const [skippedToday] = await db.query(
      `SELECT COUNT(sk.id) as totalSkipped
       FROM SubscriptionSkips sk
       JOIN Subscriptions s ON sk.subscriptionId = s.id
       JOIN Messes m ON s.messId = m.id
       WHERE m.vendorId = ? 
         AND sk.skipDate = ?
         AND s.isActive = 1`,
      [providerId, today]
    );

    const [orders] = await db.query(
      `SELECT COUNT(o.id) as totalPendingOrders
       FROM Orders o
       JOIN Messes m ON o.messId = m.id
       WHERE m.vendorId = ? 
         AND o.status IN ('pending', 'accepted', 'confirmed', 'preparing')
         AND DATE(o.createdAt) = ?`,
      [providerId, today]
    );

    const [earnings] = await db.query(
      `SELECT SUM(o.totalAmount) as todayEarnings
       FROM Orders o
       JOIN Messes m ON o.messId = m.id
       WHERE m.vendorId = ? 
         AND DATE(o.createdAt) = ? 
         AND o.status NOT IN ('cancelled', 'rejected')`,
      [providerId, today]
    );

    const effectiveSubsToday = Math.max(0, subscriptions[0].totalActiveSubs - skippedToday[0].totalSkipped);

    res.json({
      message: 'Kitchen Forecast for ' + today,
      data: {
        activeSubscriptionsToday: effectiveSubsToday,
        skippedSubscriptionsToday: skippedToday[0].totalSkipped,
        pendingOnDemandOrders: orders[0].totalPendingOrders,
        totalMealsToPrepare: effectiveSubsToday + orders[0].totalPendingOrders,
        todayEarnings: earnings[0].todayEarnings || 0
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
    const { status, note } = req.body;
    const orderId = req.params.id;

    const validStatuses = ['pending', 'accepted', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

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
      
      // Record timeline
      await db.query(
        'INSERT INTO OrderStatusTimeline (orderId, status, note) VALUES (?, ?, ?)',
        [orderId, status, note || null]
      );

      // Send Push Notification securely
      const customerId = orderCheck[0].customerId;
      const { sendPushNotification } = require('./notificationController');
      await sendPushNotification(customerId, 'Order Update', `Your order #${orderId.slice(0,6)} is now ${status}.`, { orderId, status });
    } else {
      await db.query('UPDATE Orders SET status = ? WHERE id = ?', [status, orderId]);
      await db.query(
        'INSERT INTO OrderStatusTimeline (orderId, status, note) VALUES (?, ?, ?)',
        [orderId, status, note || null]
      );
    }

    res.json({ message: 'Order status updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
