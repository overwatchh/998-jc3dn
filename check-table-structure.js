const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkTableStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Checking email_reminder_logs table structure...');
    
    const [tables] = await connection.execute(`SHOW TABLES LIKE 'email_reminder_logs'`);
    if (tables.length === 0) {
      console.log('❌ email_reminder_logs table does not exist!');
      return;
    }

    const [columns] = await connection.execute('DESCRIBE email_reminder_logs');
    console.log('📋 Table columns:');
    columns.forEach(col => {
      console.log(`   ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
    });

    const [count] = await connection.execute('SELECT COUNT(*) as total FROM email_reminder_logs');
    console.log(`📊 Total rows: ${count[0].total}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTableStructure();