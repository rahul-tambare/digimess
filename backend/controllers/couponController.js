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
