require('dotenv').config({path: './backend/.env'});
const db = require('./backend/config/db');

async function migrate() {
    try {
        await db.query(`ALTER TABLE Users ADD COLUMN gender VARCHAR(20) DEFAULT NULL`);
        console.log("Added gender column");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log("gender column already exists");
        else console.error(e);
    }

    try {
        await db.query(`ALTER TABLE Users ADD COLUMN dateOfBirth DATE DEFAULT NULL`);
        console.log("Added dateOfBirth column");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log("dateOfBirth column already exists");
        else console.error(e);
    }
    process.exit(0);
}

migrate();
