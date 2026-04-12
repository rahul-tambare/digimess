const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const migrateDB = async () => {
    try {
        console.log('Connecting to MySQL to apply migration...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'digimess',
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false, ca: fs.readFileSync(path.join(__dirname, '../global-bundle.pem')) } : undefined
        });

        console.log('Adding allowedMesses column to Subscriptions table if it does not exist...');
        // First check if column exists
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Subscriptions' AND COLUMN_NAME = 'allowedMesses'
        `, [process.env.DB_NAME || 'digimess']);

        if (columns.length === 0) {
            await connection.query('ALTER TABLE Subscriptions ADD COLUMN allowedMesses JSON DEFAULT NULL AFTER messId;');
            console.log('Successfully added allowedMesses column to Subscriptions table.');
        } else {
            console.log('Column allowedMesses already exists in Subscriptions table.');
        }

        console.log('Migration completed successfully!');
        await connection.end();
        process.exit(0);

    } catch (error) {
        console.error('Error applying migration:', error);
        process.exit(1);
    }
};

migrateDB();
