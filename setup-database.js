const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  console.log('🗄️ Setting up database tables...');
  
  try {
    const db = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      multipleStatements: true
    });
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'src/lib/server/db_schema/db_create.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL
    console.log('📝 Executing database schema...');
    await db.query(sql);
    
    console.log('✅ Database tables created successfully!');
    
    // Test that tables exist
    const [tables] = await db.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('courses', 'user', 'enrollments', 'email_reminder_settings', 'email_reminder_logs')
    `, [process.env.DB_NAME]);
    
    console.log('📋 Created tables:', tables.map(t => t.TABLE_NAME));
    
    await db.end();
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    if (error.message.includes('Access denied')) {
      console.log('💡 Check your database credentials in .env.local');
    }
    if (error.message.includes("doesn't exist")) {
      console.log('💡 Make sure the database "qr_attendance_app" exists');
    }
  }
}

setupDatabase();