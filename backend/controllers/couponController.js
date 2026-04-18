const db = require('../config/db');

// POST /api/coupons/validate — validate a coupon code
exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return res.status(400).json({ valid: false, message: 'Coupon code is required' });

    const [rows] = await db.query(
      `SELECT * FROM Coupons WHERE code = ? AND isActive = 1 
       AND validFrom <= CURDATE() AND validTo >= CURDATE()`,
      [code]
    );

    if (rows.length === 0) {
      return res.json({ valid: false, discount: 0, message: 'Invalid or expired coupon' });
    }

    const coupon = rows[0];

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.json({ valid: false, discount: 0, message: 'Coupon usage limit reached' });
    }

    // Check min order amount
    const amount = parseFloat(orderAmount) || 0;
    if (amount < parseFloat(coupon.minOrderAmount)) {
      return res.json({ valid: false, discount: 0, message: `Minimum order amount is ₹${coupon.minOrderAmount}` });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'fixed') {
      discount = parseFloat(coupon.discountValue);
    } else {
      discount = (amount * parseFloat(coupon.discountValue)) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, parseFloat(coupon.maxDiscount));
      }
    }

    res.json({
      valid: true,
      discount,
      couponId: coupon.id,
      message: `Coupon applied! You save ₹${discount}`,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Admin CRUD ──

exports.getAllCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM Coupons');
    const [rows] = await db.query('SELECT * FROM Coupons ORDER BY createdAt DESC LIMIT ? OFFSET ?', [limit, offset]);
    
    res.json({
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving coupons' });
  }
};

exports.createCoupon = async (req, res) => {
  const { code, discountType, discountValue, minOrderAmount, maxDiscount, validFrom, validTo, usageLimit } = req.body;
  try {
    const uuid = require('crypto').randomUUID();
    await db.query(
      'INSERT INTO Coupons (id, code, discountType, discountValue, minOrderAmount, maxDiscount, validFrom, validTo, usageLimit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [uuid, code, discountType, discountValue, minOrderAmount || 0, maxDiscount || null, validFrom, validTo, usageLimit || null]
    );
    res.status(201).json({ id: uuid, message: 'Coupon created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating coupon' });
  }
};

exports.updateCoupon = async (req, res) => {
  const { id } = req.params;
  const { code, discountType, discountValue, minOrderAmount, maxDiscount, validFrom, validTo, usageLimit, isActive } = req.body;
  try {
    await db.query(
      'UPDATE Coupons SET code = ?, discountType = ?, discountValue = ?, minOrderAmount = ?, maxDiscount = ?, validFrom = ?, validTo = ?, usageLimit = ?, isActive = ? WHERE id = ?',
      [code, discountType, discountValue, minOrderAmount, maxDiscount || null, validFrom, validTo, usageLimit || null, isActive, id]
    );
    res.json({ message: 'Coupon updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating coupon' });
  }
};

exports.deleteCoupon = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM Coupons WHERE id = ?', [id]);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting coupon' });
  }
};
