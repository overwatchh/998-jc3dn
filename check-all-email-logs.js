const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkAllEmailLogs() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Checking ALL email logs for Software Engineering (subject_id = 1):');
    
    const [rows] = await connection.execute(`
      SELECT student_id, reminder_type, sent_at, email_status, missed_count, total_sessions, attendance_percentage
      FROM email_reminder_logs 
      WHERE subject_id = 1 
      ORDER BY sent_at DESC 
      LIMIT 20
    `);
    
    rows.forEach((row, i) => {
      const time = new Date(row.sent_at).toLocaleTimeString();
      const studentId = row.student_id.slice(-6);
      console.log(`   ${i+1}. ${studentId} | ${row.reminder_type} | ${row.email_status} | ${time} | missed: ${row.missed_count}/${row.total_sessions} | ${row.attendance_percentage}%`);
    });

    console.log('\n📊 Summary:');
    console.log(`   Total logged emails: ${rows.length}`);
    
    // Check for emails sent in the last hour
    const [recentRows] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM email_reminder_logs 
      WHERE subject_id = 1 AND sent_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);
    
    console.log(`   Emails sent in last hour: ${recentRows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkAllEmailLogs();