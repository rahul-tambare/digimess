/**
 * Phase 1 Migration — Unified Backend Architecture
 * 
 * Adds missing columns to Users, Messes, Orders tables
 * Creates new tables: Favorites, Coupons, SubscriptionSkips, OrderStatusTimeline
 * 
 * Safe to run multiple times (uses IF NOT EXISTS / column-existence checks)
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'digimess',
    ssl: process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false, ca: fs.readFileSync(path.join(__dirname, '../global-bundle.pem')) }
      : undefined,
    multipleStatements: true,
  });

  console.log('🔄 Phase 1 Migration — Starting...\n');

  // Helper: add column if it doesn't exist
  async function addColumnIfNotExists(table, column, definition) {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    if (rows[0].cnt === 0) {
      await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      console.log(`  ✅ Added ${table}.${column}`);
    } else {
      console.log(`  ⏭️  ${table}.${column} already exists`);
    }
  }

  // ─────────────────────────────────────────────
  // 1. Users table — missing columns
  // ─────────────────────────────────────────────
  console.log('📋 1/5 — Users table columns');
  await addColumnIfNotExists('Users', 'profilePhoto', 'VARCHAR(500) DEFAULT NULL');
  await addColumnIfNotExists('Users', 'dietaryPreference', "VARCHAR(50) DEFAULT NULL COMMENT 'veg/non-veg/both'");
  await addColumnIfNotExists('Users', 'governmentIdType', 'VARCHAR(50) DEFAULT NULL');
  await addColumnIfNotExists('Users', 'governmentIdNumber', 'VARCHAR(100) DEFAULT NULL');
  await addColumnIfNotExists('Users', 'governmentIdPhotos', 'JSON DEFAULT NULL');
  await addColumnIfNotExists('Users', 'locationLat', 'DECIMAL(10,7) DEFAULT NULL');
  await addColumnIfNotExists('Users', 'locationLng', 'DECIMAL(10,7) DEFAULT NULL');
  await addColumnIfNotExists('Users', 'locationArea', 'VARCHAR(255) DEFAULT NULL');
  console.log('');

  // ─────────────────────────────────────────────
  // 2. Messes table — missing columns
  // ─────────────────────────────────────────────
  console.log('📋 2/5 — Messes table columns');
  await addColumnIfNotExists('Messes', 'tagline', 'VARCHAR(500) DEFAULT NULL');
  await addColumnIfNotExists('Messes', 'seatingCapacity', 'INT DEFAULT NULL');
  await addColumnIfNotExists('Messes', 'maxDailyOrders', 'INT DEFAULT NULL');
  await addColumnIfNotExists('Messes', 'establishmentYear', 'INT DEFAULT NULL');
  await addColumnIfNotExists('Messes', 'fssaiLicense', 'VARCHAR(100) DEFAULT NULL');
  await addColumnIfNotExists('Messes', 'totalOrders', 'INT DEFAULT 0');
  await addColumnIfNotExists('Messes', 'packagingType', "VARCHAR(50) DEFAULT NULL COMMENT 'Disposable/Steel Tiffin/Both'");
  await addColumnIfNotExists('Messes', 'subscriptionPlans', 'BOOLEAN DEFAULT FALSE');
  await addColumnIfNotExists('Messes', 'preBookingRequired', 'BOOLEAN DEFAULT FALSE');
  await addColumnIfNotExists('Messes', 'selfPickup', 'BOOLEAN DEFAULT FALSE');
  await addColumnIfNotExists('Messes', 'dietaryOptions', 'JSON DEFAULT NULL');
  await addColumnIfNotExists('Messes', 'breakfastStartTime', 'TIME DEFAULT NULL');
  await addColumnIfNotExists('Messes', 'breakfastEndTime', 'TIME DEFAULT NULL');
  await addColumnIfNotExists('Messes', 'openingTime', 'TIME DEFAULT NULL');
  await addColumnIfNotExists('Messes', 'closingTime', 'TIME DEFAULT NULL');
  await addColumnIfNotExists('Messes', 'operatingDays', 'JSON DEFAULT NULL');
  await addColumnIfNotExists('Messes', 'advanceCutoffTime', 'TIME DEFAULT NULL');
  await addColumnIfNotExists('Messes', 'holidayDates', 'JSON DEFAULT NULL');
  await addColumnIfNotExists('Messes', 'freeDeliveryAbove', 'DECIMAL(10,2) DEFAULT NULL');
  await addColumnIfNotExists('Messes', 'coverImage', 'VARCHAR(500) DEFAULT NULL');
  console.log('');

  // ─────────────────────────────────────────────
  // 3. Orders table — missing columns
  // ─────────────────────────────────────────────
  console.log('📋 3/5 — Orders table columns');
  await addColumnIfNotExists('Orders', 'deliveryType', "ENUM('delivery', 'pickup', 'dine-in') DEFAULT 'delivery'");
  await addColumnIfNotExists('Orders', 'deliveryCharge', 'DECIMAL(10,2) DEFAULT 0.00');
  await addColumnIfNotExists('Orders', 'platformFee', 'DECIMAL(10,2) DEFAULT 0.00');
  await addColumnIfNotExists('Orders', 'discount', 'DECIMAL(10,2) DEFAULT 0.00');
  await addColumnIfNotExists('Orders', 'couponId', 'VARCHAR(36) DEFAULT NULL');
  await addColumnIfNotExists('Orders', 'specialNote', 'TEXT DEFAULT NULL');
  await addColumnIfNotExists('Orders', 'deliverySlot', 'VARCHAR(100) DEFAULT NULL');
  await addColumnIfNotExists('Orders', 'paymentMethod', "VARCHAR(50) DEFAULT NULL COMMENT 'wallet/upi/card/cod/subscription'");
  await addColumnIfNotExists('Orders', 'subscriptionId', 'VARCHAR(36) DEFAULT NULL');
  await addColumnIfNotExists('Orders', 'address', 'TEXT DEFAULT NULL');
  await addColumnIfNotExists('Orders', 'estimatedDelivery', 'DATETIME DEFAULT NULL');
  await addColumnIfNotExists('Orders', 'acceptedAt', 'DATETIME DEFAULT NULL');
  await addColumnIfNotExists('Orders', 'preparedAt', 'DATETIME DEFAULT NULL');
  await addColumnIfNotExists('Orders', 'deliveredAt', 'DATETIME DEFAULT NULL');
  await addColumnIfNotExists('Orders', 'cancelledAt', 'DATETIME DEFAULT NULL');
  console.log('');

  // ─────────────────────────────────────────────
  // 4. MessAddresses table — missing columns
  // ─────────────────────────────────────────────
  console.log('📋 4/5 — MessAddresses table columns');
  await addColumnIfNotExists('MessAddresses', 'area', 'VARCHAR(255) DEFAULT NULL');
  await addColumnIfNotExists('MessAddresses', 'landmark', 'VARCHAR(255) DEFAULT NULL');
  await addColumnIfNotExists('MessAddresses', 'deliveryRadius', 'DECIMAL(10,2) DEFAULT 5.00');
  console.log('');

  // ─────────────────────────────────────────────
  // 5. New tables
  // ─────────────────────────────────────────────
  console.log('📋 5/5 — Creating new tables');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS Favorites (
      id VARCHAR(36) PRIMARY KEY,
      customerId VARCHAR(36) NOT NULL,
      messId VARCHAR(36) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_fav (customerId, messId),
      FOREIGN KEY (customerId) REFERENCES Users(id) ON DELETE CASCADE,
      FOREIGN KEY (messId) REFERENCES Messes(id) ON DELETE CASCADE
    )
  `);
  console.log('  ✅ Favorites table ready');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS Coupons (
      id VARCHAR(36) PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      discountType ENUM('fixed', 'percentage') NOT NULL,
      discountValue DECIMAL(10,2) NOT NULL,
      minOrderAmount DECIMAL(10,2) DEFAULT 0.00,
      maxDiscount DECIMAL(10,2) DEFAULT NULL,
      validFrom DATE NOT NULL,
      validTo DATE NOT NULL,
      usageLimit INT DEFAULT NULL,
      usedCount INT DEFAULT 0,
      isActive BOOLEAN DEFAULT TRUE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✅ Coupons table ready');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS SubscriptionSkips (
      id VARCHAR(36) PRIMARY KEY,
      subscriptionId VARCHAR(36) NOT NULL,
      skipDate DATE NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_skip (subscriptionId, skipDate),
      FOREIGN KEY (subscriptionId) REFERENCES Subscriptions(id) ON DELETE CASCADE
    )
  `);
  console.log('  ✅ SubscriptionSkips table ready');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS OrderStatusTimeline (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderId VARCHAR(36) NOT NULL,
      status VARCHAR(50) NOT NULL,
      note TEXT DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE
    )
  `);
  console.log('  ✅ OrderStatusTimeline table ready');

  // ─────────────────────────────────────────────
  // 6. Add indexes for performance
  // ─────────────────────────────────────────────
  console.log('\n📋 Adding indexes...');
  
  const indexes = [
    ['idx_thalis_mess_meal', 'Thalis', '(messId, mealTime)'],
    ['idx_orders_customer_status', 'Orders', '(customerId, status)'],
    ['idx_orders_mess_status', 'Orders', '(messId, status)'],
    ['idx_menus_mess_avail', 'Menus', '(messId, isAvailable)'],
    ['idx_wallet_user', 'WalletTransactions', '(userId)'],
    ['idx_reviews_mess', 'Reviews', '(messId)'],
    ['idx_timeline_order', 'OrderStatusTimeline', '(orderId)'],
  ];

  for (const [name, table, cols] of indexes) {
    try {
      await connection.query(`CREATE INDEX \`${name}\` ON \`${table}\` ${cols}`);
      console.log(`  ✅ Index ${name} created`);
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log(`  ⏭️  Index ${name} already exists`);
      } else {
        console.log(`  ⚠️  Index ${name}: ${e.message}`);
      }
    }
  }

  console.log('\n🎉 Phase 1 Migration completed successfully!\n');
  await connection.end();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
