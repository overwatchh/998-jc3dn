const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testAttendanceSystem() {
  console.log('🧪 Testing Attendance Reminder System...\n');
  
  // Test 1: Database Connection
  console.log('1️⃣ Testing database connection...');
  try {
    const db = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
    
    const [rows] = await db.query('SELECT 1 as test');
    console.log('✅ Database connection successful\n');
    
    // Test 2: Check if tables exist
    console.log('2️⃣ Checking if email reminder tables exist...');
    const [tables] = await db.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('email_reminder_settings', 'email_reminder_logs', 'student_attendance_summary')
    `, [process.env.DB_NAME]);
    
    console.log('Found tables:', tables.map(t => t.TABLE_NAME));
    if (tables.length === 3) {
      console.log('✅ All required tables exist\n');
    } else {
      console.log('⚠️ Some tables missing - run database migration first\n');
    }
    
    // Test 3: Sample data check
    console.log('3️⃣ Checking for sample data...');
    const [courses] = await db.query('SELECT COUNT(*) as count FROM courses WHERE status = "active"');
    const [students] = await db.query('SELECT COUNT(*) as count FROM enrollments');
    
    console.log(`Found ${courses[0].count} active courses`);
    console.log(`Found ${students[0].count} student enrollments`);
    
    if (courses[0].count === 0 || students[0].count === 0) {
      console.log('⚠️ You need some sample data to test reminders');
      console.log('💡 Create at least one active course with enrolled students\n');
    }
    
    // Test 4: Email configuration
    console.log('4️⃣ Testing email configuration...');
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    await transporter.verify();
    console.log('✅ Email service ready\n');
    
    await db.end();
    
    console.log('🎉 All systems ready for testing!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your Next.js app: npm run dev');
    console.log('2. Test API endpoints (see examples below)');
    console.log('3. Use manual commands to test reminders');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAttendanceSystem();