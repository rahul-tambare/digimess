const db = require('../config/db');

async function syncColumns() {
    const alterations = [
        "ALTER TABLE Users ADD COLUMN gender VARCHAR(20) DEFAULT NULL",
        "ALTER TABLE Users ADD COLUMN dateOfBirth DATE DEFAULT NULL",
        "ALTER TABLE Users ADD COLUMN isActive TINYINT(1) DEFAULT 1",
        "ALTER TABLE Users ADD COLUMN isDeleted TINYINT(1) DEFAULT 0",
        "ALTER TABLE Users ADD COLUMN deletedAt DATETIME DEFAULT NULL",
        "ALTER TABLE Messes ADD COLUMN isActive TINYINT(1) DEFAULT 1",
        "ALTER TABLE Messes ADD COLUMN isDeleted TINYINT(1) DEFAULT 0",
        "ALTER TABLE Messes ADD COLUMN deletedAt DATETIME DEFAULT NULL",
        "ALTER TABLE Messes ADD COLUMN capacity INT DEFAULT NULL",
        "ALTER TABLE Messes ADD COLUMN deliveryRadius DECIMAL(10,2) DEFAULT 5.00",
        "ALTER TABLE Orders ADD COLUMN isDeleted TINYINT(1) DEFAULT 0",
        "ALTER TABLE Orders ADD COLUMN deletedAt DATETIME DEFAULT NULL",
        "ALTER TABLE BankDetails ADD COLUMN upiId VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE Messes ADD CONSTRAINT unique_vendor_mess UNIQUE (vendorId)",
        "ALTER TABLE Subscriptions ADD COLUMN pauseStartDate DATE DEFAULT NULL",
        "ALTER TABLE Subscriptions ADD COLUMN pauseEndDate DATE DEFAULT NULL",
        "ALTER TABLE Orders ADD COLUMN deliveryAddress TEXT DEFAULT NULL"
    ];

    console.log('Starting column synchronization...');
    for (const sql of alterations) {
        try {
            await db.query(sql);
            console.log(`[SUCCESS] Executed: ${sql.split('ADD COLUMN')[1]}`);
        } catch (err) {
            // Error 1060 is ER_DUP_FIELDNAME (Duplicate column name)
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log(`[SKIPPED] Column already exists: ${sql.split('ADD COLUMN')[1]}`);
            } else {
                console.error(`[ERROR] Failed to execute: ${sql} | Reason: ${err.message}`);
            }
        }
    }
    console.log('Synchronization perfectly complete!');
    process.exit(0);
}

syncColumns();
