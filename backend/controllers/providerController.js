const db = require('../config/db');
const ledgerService = require('../services/ledgerService');

// =============================================
// GET /api/provider/dashboard — Dashboard stats
// =============================================
exports.getDashboard = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Get vendor's mess
    const [messes] = await db.query(
      'SELECT id, name, isOpen, rating FROM Messes WHERE vendorId = ? AND isDeleted = 0 LIMIT 1',
      [vendorId]
    );
    if (messes.length === 0) {
      return res.json({ hasMess: false, message: 'No mess registered yet' });
    }
    const mess = messes[0];

    // Today's orders count
    const [todayOrders] = await db.query(
      `SELECT COUNT(*) as count FROM Orders WHERE messId = ? AND DATE(createdAt) = ? AND isDeleted = 0`,
      [mess.id, today]
    );

    // Today's earnings
    const [todayEarnings] = await db.query(
      `SELECT COALESCE(SUM(totalAmount), 0) as total FROM Orders 
       WHERE messId = ? AND DATE(createdAt) = ? AND status IN ('delivered', 'confirmed', 'preparing', 'out_for_delivery') AND isDeleted = 0`,
      [mess.id, today]
    );

    // Pending orders (new + confirmed + preparing)
    const [pending] = await db.query(
      `SELECT COUNT(*) as count FROM Orders WHERE messId = ? AND status IN ('pending', 'confirmed', 'preparing') AND isDeleted = 0`,
      [mess.id]
    );

    // New orders count (just pending)
    const [newOrders] = await db.query(
      `SELECT COUNT(*) as count FROM Orders WHERE messId = ? AND status = 'pending' AND isDeleted = 0`,
      [mess.id]
    );

    // Total orders all time
    const [totalOrders] = await db.query(
      `SELECT COUNT(*) as count FROM Orders WHERE messId = ? AND isDeleted = 0`,
      [mess.id]
    );

    // Recent 5 orders
    const [recentOrders] = await db.query(
      `SELECT o.id, o.totalAmount, o.status, o.items, o.createdAt,
              u.name AS customerName, u.phone AS customerPhone
       FROM Orders o
       JOIN Users u ON o.customerId = u.id
       WHERE o.messId = ? AND o.isDeleted = 0
       ORDER BY o.createdAt DESC LIMIT 5`,
      [mess.id]
    );

    res.json({
      hasMess: true,
      mess: {
        id: mess.id,
        name: mess.name,
        isOpen: mess.isOpen,
        rating: mess.rating,
        totalOrders: totalOrders[0].count,
      },
      today: {
        orders: todayOrders[0].count,
        earnings: parseFloat(todayEarnings[0].total),
        pending: pending[0].count,
        newOrders: newOrders[0].count,
      },
      recentOrders: recentOrders.map(o => ({
        ...o,
        items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
      })),
    });
  } catch (e) {
    console.error('Dashboard error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================
// GET /api/provider/earnings — Earnings summary
// =============================================
exports.getEarnings = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const [messes] = await db.query('SELECT id FROM Messes WHERE vendorId = ? AND isDeleted = 0', [vendorId]);
    if (messes.length === 0) return res.json({ earnings: null });
    const messId = messes[0].id;

    const earningsQuery = (additionalCondition = '', queryParams = []) =>
      db.query(
        `SELECT COALESCE(SUM(totalAmount), 0) as total, COUNT(*) as orders
         FROM Orders WHERE messId = ? AND status NOT IN ('cancelled') AND isDeleted = 0 ${additionalCondition}`,
        [messId, ...queryParams]
      );

    // Today
    const [todayData] = await earningsQuery(`AND DATE(createdAt) = ?`, [today]);
    
    // This week (Mon-Sun)
    const [weekData] = await earningsQuery(`AND YEARWEEK(createdAt, 1) = YEARWEEK(CURDATE(), 1)`);
    
    // This month
    const [monthData] = await earningsQuery(`AND YEAR(createdAt) = YEAR(CURDATE()) AND MONTH(createdAt) = MONTH(CURDATE())`);
    
    // Lifetime
    const [lifetimeData] = await earningsQuery('');

    // Daily breakdown for chart (last 7 days)
    const [dailyBreakdown] = await db.query(
      `SELECT DATE(createdAt) as date, DAYNAME(createdAt) as day, 
              COALESCE(SUM(totalAmount), 0) as amount, COUNT(*) as orders
       FROM Orders 
       WHERE messId = ? AND status NOT IN ('cancelled') AND isDeleted = 0
         AND createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(createdAt), DAYNAME(createdAt)
       ORDER BY date ASC`,
      [messId]
    );

    res.json({
      today: { earnings: parseFloat(todayData[0].total), orders: todayData[0].orders },
      thisWeek: { earnings: parseFloat(weekData[0].total), orders: weekData[0].orders },
      thisMonth: { earnings: parseFloat(monthData[0].total), orders: monthData[0].orders },
      lifetime: { earnings: parseFloat(lifetimeData[0].total), orders: lifetimeData[0].orders },
      dailyBreakdown,
    });
  } catch (e) {
    console.error('Earnings error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================
// GET /api/provider/earnings/transactions — Transaction list
// =============================================
exports.getTransactions = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [messes] = await db.query('SELECT id FROM Messes WHERE vendorId = ? AND isDeleted = 0', [vendorId]);
    if (messes.length === 0) return res.json({ transactions: [], total: 0 });
    const messId = messes[0].id;

    const [transactions] = await db.query(
      `SELECT o.id, o.totalAmount, o.status, o.createdAt,
              u.name AS customerName
       FROM Orders o
       JOIN Users u ON o.customerId = u.id
       WHERE o.messId = ? AND o.isDeleted = 0
       ORDER BY o.createdAt DESC
       LIMIT ? OFFSET ?`,
      [messId, limit, offset]
    );

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM Orders WHERE messId = ? AND isDeleted = 0',
      [messId]
    );

    res.json({
      transactions,
      total: countResult[0].total,
      page,
      totalPages: Math.ceil(countResult[0].total / limit),
    });
  } catch (e) {
    console.error('Transactions error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================
// PUT /api/provider/profile — Update vendor profile
// =============================================
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, gender, dateOfBirth } = req.body;

    await db.query(
      `UPDATE Users SET 
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        gender = COALESCE(?, gender),
        dateOfBirth = COALESCE(?, dateOfBirth)
       WHERE id = ?`,
      [name, email, gender, dateOfBirth, req.user.id]
    );

    const [updated] = await db.query('SELECT id, name, email, phone, gender, dateOfBirth, role FROM Users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Profile updated', user: updated[0] });
  } catch (e) {
    console.error('Profile update error:', e);
    
    if (e.code === 'ER_DUP_ENTRY' && e.message.includes('email')) {
      return res.status(400).json({ error: 'This email is already in use by another account.' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================
// PATCH /api/provider/mess/toggle — Toggle mess open/closed
// =============================================
exports.toggleMess = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const [messes] = await db.query('SELECT id, isOpen FROM Messes WHERE vendorId = ? AND isDeleted = 0', [vendorId]);
    if (messes.length === 0) return res.status(404).json({ error: 'No mess found' });

    const newStatus = !messes[0].isOpen;
    await db.query('UPDATE Messes SET isOpen = ? WHERE id = ?', [newStatus, messes[0].id]);

    res.json({ message: `Mess is now ${newStatus ? 'OPEN' : 'CLOSED'}`, isOpen: newStatus });
  } catch (e) {
    console.error('Toggle error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================
// GET /api/provider/orders/:id — Order detail
// =============================================
exports.getOrderDetail = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const orderId = req.params.id;

    const [rows] = await db.query(
      `SELECT o.*, 
              u.name AS customerName, u.phone AS customerPhone,
              m.name AS messName
       FROM Orders o
       JOIN Users u ON o.customerId = u.id
       JOIN Messes m ON o.messId = m.id
       WHERE o.id = ? AND m.vendorId = ? AND o.isDeleted = 0`,
      [orderId, vendorId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = rows[0];
    order.items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

    res.json(order);
  } catch (e) {
    console.error('Order detail error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================
// GET /api/provider/stats — Business Stats
// =============================================
exports.getBusinessStats = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const [messes] = await db.query(
      'SELECT id, name, rating FROM Messes WHERE vendorId = ? AND isDeleted = 0 LIMIT 1',
      [vendorId]
    );
    if (messes.length === 0) return res.json({ hasMess: false });
    const mess = messes[0];
    const messId = mess.id;

    // ── Orders by status ─────────────────────────────────────────────────
    const [statusRows] = await db.query(
      `SELECT status, COUNT(*) as count FROM Orders WHERE messId = ? AND isDeleted = 0 GROUP BY status`,
      [messId]
    );
    const statusMap = {};
    statusRows.forEach(r => { statusMap[r.status] = Number(r.count); });

    const totalOrders = statusRows.reduce((s, r) => s + Number(r.count), 0);
    const completedOrders = statusMap['delivered'] || 0;
    const cancelledOrders = statusMap['cancelled'] || 0;
    const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0.0';

    // ── Earnings summary ─────────────────────────────────────────────────
    const [[lifetimeRow]] = await db.query(
      `SELECT COALESCE(SUM(totalAmount), 0) as total, COUNT(*) as count
       FROM Orders WHERE messId = ? AND status NOT IN ('cancelled') AND isDeleted = 0`,
      [messId]
    );
    const [[monthRow]] = await db.query(
      `SELECT COALESCE(SUM(totalAmount), 0) as total
       FROM Orders WHERE messId = ? AND status NOT IN ('cancelled') AND isDeleted = 0
       AND YEAR(createdAt) = YEAR(CURDATE()) AND MONTH(createdAt) = MONTH(CURDATE())`,
      [messId]
    );
    const [[weekRow]] = await db.query(
      `SELECT COALESCE(SUM(totalAmount), 0) as total
       FROM Orders WHERE messId = ? AND status NOT IN ('cancelled') AND isDeleted = 0
       AND YEARWEEK(createdAt, 1) = YEARWEEK(CURDATE(), 1)`,
      [messId]
    );

    const lifetimeEarnings = parseFloat(lifetimeRow.total);
    const lifetimeCount = Number(lifetimeRow.count);
    const avgOrderValue = lifetimeCount > 0 ? (lifetimeEarnings / lifetimeCount) : 0;

    // ── Daily breakdown last 14 days ─────────────────────────────────────
    const [dailyRows] = await db.query(
      `SELECT DATE(createdAt) as date, DAYNAME(createdAt) as day,
              COALESCE(SUM(totalAmount), 0) as amount, COUNT(*) as orders
       FROM Orders WHERE messId = ? AND status NOT IN ('cancelled') AND isDeleted = 0
         AND createdAt >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
       GROUP BY DATE(createdAt), DAYNAME(createdAt)
       ORDER BY date ASC`,
      [messId]
    );

    // ── Rating breakdown ─────────────────────────────────────────────────
    const [ratingRows] = await db.query(
      `SELECT rating, COUNT(*) as count FROM Reviews WHERE messId = ? GROUP BY rating ORDER BY rating DESC`,
      [messId]
    );
    const totalReviews = ratingRows.reduce((s, r) => s + Number(r.count), 0);
    const ratingBreakdown = [5, 4, 3, 2, 1].map(star => {
      const row = ratingRows.find(r => Number(r.rating) === star);
      const count = row ? Number(row.count) : 0;
      return { star, count, pct: totalReviews > 0 ? Math.round(count / totalReviews * 100) : 0 };
    });

    // ── Recent reviews ───────────────────────────────────────────────────
    const [recentReviews] = await db.query(
      `SELECT r.rating, r.reviewText, r.createdAt, u.name as customerName
       FROM Reviews r JOIN Users u ON r.customerId = u.id
       WHERE r.messId = ? ORDER BY r.createdAt DESC LIMIT 5`,
      [messId]
    );

    // ── Top 5 customers by order count ───────────────────────────────────
    const [topCustomers] = await db.query(
      `SELECT u.name, COUNT(o.id) as orderCount, COALESCE(SUM(o.totalAmount), 0) as totalSpent
       FROM Orders o JOIN Users u ON o.customerId = u.id
       WHERE o.messId = ? AND o.isDeleted = 0 AND o.status NOT IN ('cancelled')
       GROUP BY o.customerId, u.name ORDER BY orderCount DESC LIMIT 5`,
      [messId]
    );

    res.json({
      hasMess: true,
      mess: { id: mess.id, name: mess.name, rating: mess.rating },
      orders: {
        total: totalOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        pending: (statusMap['pending'] || 0) + (statusMap['confirmed'] || 0) + (statusMap['preparing'] || 0),
        completionRate: parseFloat(completionRate),
        statusBreakdown: statusMap,
      },
      earnings: {
        lifetime: lifetimeEarnings,
        thisMonth: parseFloat(monthRow.total),
        thisWeek: parseFloat(weekRow.total),
        avgOrderValue,
      },
      reviews: {
        total: totalReviews,
        avgRating: parseFloat(mess.rating) || 0,
        breakdown: ratingBreakdown,
        recent: recentReviews,
      },
      topCustomers: topCustomers.map(c => ({
        name: c.name,
        orderCount: Number(c.orderCount),
        totalSpent: parseFloat(c.totalSpent),
      })),
      dailyBreakdown: dailyRows,
    });
  } catch (e) {
    console.error('Business stats error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================
// GET /api/provider/settlements — My settlement history
// =============================================
exports.getMySettlements = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) as count FROM Settlements WHERE vendorId = ?',
      [vendorId]
    );

    const [rows] = await db.query(
      `SELECT s.*, m.name AS messName
       FROM Settlements s
       JOIN Messes m ON s.messId = m.id
       WHERE s.vendorId = ?
       ORDER BY s.createdAt DESC
       LIMIT ? OFFSET ?`,
      [vendorId, limit, offset]
    );

    res.json({
      data: rows,
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    });
  } catch (e) {
    console.error('My settlements error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// =============================================
// GET /api/provider/ledger — My ledger entries
// =============================================
exports.getMyLedger = async (req, res) => {
  try {
    const vendorId = req.user.id;

    // Find vendor's ledger account
    const vendorAccountId = await ledgerService.getOrCreateAccount('VENDOR_WALLET', vendorId, 'USER');
    const balance = await ledgerService.getBalance(vendorAccountId);
    const entries = await ledgerService.getEntries(vendorAccountId, {
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json({ balance, ...entries });
  } catch (e) {
    console.error('My ledger error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
