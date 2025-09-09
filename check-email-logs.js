const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkEmailLogs() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Checking recent email logs...');
    
    // Check if table exists first
    const [tables] = await connection.execute(`SHOW TABLES LIKE 'email_reminder_logs'`);
    if (tables.length === 0) {
      console.log('❌ email_reminder_logs table does not exist!');
      return;
    }

    // Count recent logs
    const [countRows] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM email_reminder_logs 
      WHERE sent_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
    `);
    console.log(`📊 Recent email logs (last 30 min): ${countRows[0].count}`);

    // Show recent logs
    const [recentRows] = await connection.execute(`
      SELECT student_id, subject_id, reminder_type, email_status, sent_at 
      FROM email_reminder_logs 
      WHERE sent_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE) 
      ORDER BY sent_at DESC 
      LIMIT 20
    `);

    console.log('📧 Recent email logs:');
    recentRows.forEach((row, i) => {
      const studentId = row.student_id.slice(-6);
      const time = row.sent_at.toLocaleTimeString();
      console.log(`   ${i+1}. ${studentId} | ${row.reminder_type} | ${row.email_status} | ${time}`);
    });

    // Check for duplicates
    const [duplicates] = await connection.execute(`
      SELECT student_id, subject_id, reminder_type, COUNT(*) as count
      FROM email_reminder_logs 
      WHERE sent_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      GROUP BY student_id, subject_id, reminder_type
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);

    if (duplicates.length > 0) {
      console.log('⚠️  DUPLICATE EMAILS DETECTED:');
      duplicates.forEach(dup => {
        console.log(`   ${dup.student_id.slice(-6)} got ${dup.count} emails for ${dup.reminder_type}`);
      });
    } else {
      console.log('✅ No duplicate emails in logs');
    }

  } catch (error) {
    console.error('❌ Error checking logs:', error.message);
  } finally {
    await connection.end();
  }
}

checkEmailLogs();