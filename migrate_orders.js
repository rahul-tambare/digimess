const mysql = require('mysql2/promise');

const DATABASE_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'Rahul@123',
    database: 'digimess'
};

const migrate = async () => {
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection(DATABASE_CONFIG);

        console.log('Checking for "items" column in Orders table...');
        const [columns] = await connection.query('SHOW COLUMNS FROM Orders LIKE "items"');
        
        if (columns.length === 0) {
            console.log('Adding "items" column...');
            await connection.query('ALTER TABLE Orders ADD COLUMN items JSON AFTER totalAmount;');
            console.log('Migration successful!');
        } else {
            console.log('Column "items" already exists.');
        }
        
        await connection.end();
    } catch (err) {
        console.error('Migration failed:', err);
    }
};

migrate();
