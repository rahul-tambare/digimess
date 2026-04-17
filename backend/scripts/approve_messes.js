const db = require('../config/db');

async function approveMesses() {
  try {
    const [result] = await db.query('UPDATE Messes SET isApproved = 1, isOpen = 1 WHERE isApproved = 0 OR isOpen = 0');
    console.log(`Successfully approved and opened ${result.affectedRows} existing messes.`);
    process.exit(0);
  } catch (e) {
    console.error('Error updating messes:', e);
    process.exit(1);
  }
}

approveMesses();
