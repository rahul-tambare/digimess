const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'digimess',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false, ca: fs.readFileSync(path.join(__dirname, '../global-bundle.pem')) } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('MySQL connection pool established successfully.');
        connection.release();
    })
    .catch(error => {
        console.error('Unable to connect to the MySQL database:', error.message);
    });

module.exports = pool;
