const db = require('../config/db');

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
