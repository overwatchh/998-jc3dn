const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkDatabase() {
  console.log('🔍 Checking database structure...');
  
  try {
    const db = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
    
    // Check if database exists and we can connect
    const [result] = await db.query('SELECT DATABASE() as current_db');
    console.log('✅ Connected to database:', result[0].current_db);
    
    // List all tables
    const [tables] = await db.query('SHOW TABLES');
    console.log('\n📋 Existing tables:');
    if (tables.length === 0) {
      console.log('   (No tables found - need to create them)');
    } else {
      tables.forEach((table, index) => {
        const tableName = table[`Tables_in_${process.env.DB_NAME}`];
        console.log(`   ${index + 1}. ${tableName}`);
      });
    }
    
    // Check if specific tables needed for email reminders exist
    const requiredTables = ['courses', 'user', 'enrollments', 'email_reminder_settings', 'email_reminder_logs'];
    console.log('\n🔎 Checking required tables:');
    
    for (const tableName of requiredTables) {
      try {
        const [rows] = await db.query(`SELECT COUNT(*) as count FROM ${tableName} LIMIT 1`);
        console.log(`   ✅ ${tableName} - exists (${rows[0].count} rows)`);
      } catch (error) {
        console.log(`   ❌ ${tableName} - missing`);
      }
    }
    
    await db.end();
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkDatabase();