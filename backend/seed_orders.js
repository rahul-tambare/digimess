require('dotenv').config();
const db = require('./config/db');
const crypto = require('crypto');

(async () => {
  try {
    // Pick the first mess to assign orders to
    const [messes] = await db.query('SELECT id FROM Messes LIMIT 1');
    if (messes.length === 0) {
      console.log('No messes found in the database. Please create a mess first.');
      process.exit(1);
    }
    const messId = messes[0].id;
    
    // Pick any user to act as the customer
    const [users] = await db.query('SELECT id FROM Users LIMIT 1');
    if (users.length === 0) {
      console.log('No users found in the database.');
      process.exit(1);
    }
    const customerId = users[0].id;

    const orderId1 = crypto.randomUUID();
    const orderId2 = crypto.randomUUID();
    const orderId3 = crypto.randomUUID();

    const items1 = JSON.stringify([{ name: 'Deluxe Veg Thali', quantity: 2 }, { name: 'Extra Roti', quantity: 5 }]);
    const items2 = JSON.stringify([{ name: 'Standard Subscription Thali', quantity: 1 }]);
    const items3 = JSON.stringify([{ name: 'Mini Maharashtrian Thali', quantity: 1 }]);

    await db.query(
      `INSERT INTO Orders (id, customerId, messId, totalAmount, orderType, items, status) 
       VALUES 
       (?, ?, ?, ?, ?, ?, 'pending'),
       (?, ?, ?, ?, ?, ?, 'confirmed'),
       (?, ?, ?, ?, ?, ?, 'preparing')`,
      [
        orderId1, customerId, messId, 320, 'on_demand', items1,
        orderId2, customerId, messId, 0, 'subscription', items2,
        orderId3, customerId, messId, 150, 'on_demand', items3
      ]
    );

    console.log('✅ Successfully inserted 3 dummy orders (Pending, Confirmed, Preparing) into the database!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error executing seed script:', e.message);
    process.exit(1);
  }
})();
