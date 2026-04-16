const db = require('./config/db');

async function checkTables() {
    const expectedTables = [
        'Users', 'Messes', 'Menus', 'Subscriptions', 'Orders',
        'WalletTransactions', 'PlanCategories', 'SubscriptionPlans', 'AppConfig',
        'Addresses', 'Reviews', 'DeviceRegistration', 'NotificationLogs',
        'FAQs', 'AdminCharges', 'OrderDetails', 'PaymentSessions',
        'MessAddresses', 'BankDetails'
    ];

    try {
        const [rows] = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'digimess'");
        const existingTables = rows.map(r => r.TABLE_NAME.toLowerCase());

        console.log('--- Database Table Check ---');
        let missing = [];
        expectedTables.forEach(table => {
            if (existingTables.includes(table.toLowerCase())) {
                console.log(`[OK] ${table}`);
            } else {
                console.log(`[MISSING] ${table}`);
                missing.push(table);
            }
        });

        if (missing.length === 0) {
            console.log('\nAll tables are correctly added.');
        } else {
            console.log(`\nFound ${missing.length} missing tables: ${missing.join(', ')}`);
        }
        process.exit(0);
    } catch (err) {
        console.error('Error checking tables:', err.message);
        process.exit(1);
    }
}

checkTables();
