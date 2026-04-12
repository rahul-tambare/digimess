const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function resetAdmin() {
  try {
    const email = 'admin@digimess.com';
    const plainPass = 'admin123';
    const hash = await bcrypt.hash(plainPass, 10);
    
    // Check if admin exists
    const [rows] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (rows.length > 0) {
      console.log('Update existing user...');
      await db.query('UPDATE Users SET password = ?, role = "admin" WHERE email = ?', [hash, email]);
      console.log('Admin password forcefully reset to admin123!');
    } else {
      console.log('Creating new admin...');
      const fallbackPhone = '000000000'+Math.floor(Math.random()*9); // Avoid dup phone
      await db.query('INSERT IGNORE INTO Users (id, phone, name, email, password, role, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [uuidv4(), fallbackPhone, 'System Admin', email, hash, 'admin', true]);
      console.log('New admin fully created with admin123!');
    }
  } catch(e) {
    console.error('Failed to reset:', e.message);
  } finally {
    process.exit();
  }
}
resetAdmin();
