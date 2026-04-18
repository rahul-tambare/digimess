const db = require('../config/db');

async function migrate() {
  try {
    console.log('Adding isSubscriptionThali column...');
    await db.query('ALTER TABLE Thalis ADD COLUMN isSubscriptionThali BOOLEAN DEFAULT FALSE');
    console.log('Added isSubscriptionThali column');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('isSubscriptionThali already exists, skipping');
    } else {
      console.error(e);
    }
  }

  try {
    console.log('Adding subscriptionExtraCharge column...');
    await db.query('ALTER TABLE Thalis ADD COLUMN subscriptionExtraCharge DECIMAL(10,2) DEFAULT 0.00');
    console.log('Added subscriptionExtraCharge column');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('subscriptionExtraCharge already exists, skipping');
    } else {
      console.error(e);
    }
  }

  console.log('Migration complete');
  process.exit(0);
}

migrate();
