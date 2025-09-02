const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkSentEmails() {
  console.log('📧 Checking sent email reminders...');
  
  try {
    const db = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
    
    const [emails] = await db.query(`
      SELECT 
        erl.id,
        u.name as student_name,
        c.name as course_name,
        erl.reminder_type,
        erl.session_type,
        erl.attendance_percentage,
        erl.email_subject,
        erl.email_status,
        erl.sent_at
      FROM email_reminder_logs erl
      JOIN user u ON erl.student_id = u.id
      JOIN courses c ON erl.course_id = c.id
      ORDER BY erl.sent_at DESC
      LIMIT 10
    `);
    
    console.log(`\n📋 Found ${emails.length} sent emails:`);
    
    emails.forEach((email, index) => {
      console.log(`\n${index + 1}. 📧 ${email.student_name}`);
      console.log(`   Course: ${email.course_name}`);
      console.log(`   Type: ${email.reminder_type} (${email.session_type})`);
      console.log(`   Attendance: ${email.attendance_percentage}%`);
      console.log(`   Subject: ${email.email_subject}`);
      console.log(`   Status: ${email.email_status}`);
      console.log(`   Sent: ${email.sent_at}`);
    });
    
    // Get unique email preview URLs by checking the latest email
    console.log('\n🔗 To view the actual emails, visit these URLs:');
    console.log('   (Ethereal Email captures all outgoing emails for testing)');
    console.log('   https://ethereal.email/messages');
    console.log('\n💡 Look for emails from: vknsmx3cuesasvo6@ethereal.email');
    
    await db.end();
    
  } catch (error) {
    console.error('❌ Failed to check emails:', error.message);
  }
}

checkSentEmails();