const db = require('../config/db');

// POST /api/invoices/generate
exports.generateInvoices = async (req, res) => {
  try {
    const vendorId = req.user.id;
    // Basic implementation: Calculate total delivered orders for this vendor this month
    const [orders] = await db.query(
      `SELECT o.id, o.totalAmount, o.createdAt 
       FROM Orders o 
       JOIN Messes m ON o.messId = m.id 
       WHERE m.vendorId = ? AND o.status = 'delivered' 
         AND MONTH(o.createdAt) = MONTH(CURRENT_DATE())
         AND YEAR(o.createdAt) = YEAR(CURRENT_DATE())`,
      [vendorId]
    );

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

    res.json({
      message: 'Invoice generated for the current month',
      invoice: {
        vendorId,
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        totalOrders: orders.length,
        totalRevenue,
        status: 'Generated'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error generating invoices' });
  }
};

// GET /api/invoices/items
exports.getInvoiceItems = async (req, res) => {
  try {
    const vendorId = req.user.id;
    // Fetch all delivered orders as the invoice "items" history
    const [items] = await db.query(
      `SELECT o.id, o.totalAmount, o.createdAt, u.name as customerName 
       FROM Orders o 
       JOIN Messes m ON o.messId = m.id
       JOIN Users u ON o.customerId = u.id
       WHERE m.vendorId = ? AND o.status = 'delivered'`,
      [vendorId]
    );

    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error retrieving invoice items' });
  }
};
