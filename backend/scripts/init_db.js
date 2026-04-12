const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const initDB = async () => {
    try {
        console.log('Connecting to MySQL to initialize database...');
        // Connect without a specific database to create it first if necessary
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false, ca: fs.readFileSync(path.join(__dirname, '../global-bundle.pem')) } : undefined,
            multipleStatements: true // Essential for running multiple SQL queries in one go
        });

        const dbName = process.env.DB_NAME || 'digimess';
        console.log(`Creating database ${dbName} if it doesn't exist...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await connection.query(`USE \`${dbName}\`;`);

        console.log('Reading schema.sql...');
        const schemaPath = path.join(__dirname, '../models/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema...');
        await connection.query(schema);

        console.log('Database initialization completed successfully!');
        await connection.end();
        process.exit(0);

    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};

initDB();
