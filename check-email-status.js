// Check email delivery status and SMTP configuration
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');

async function checkEmailStatus() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('📧 CHECKING EMAIL DELIVERY STATUS');
    console.log('================================');
    
    // Check if our Week 6 session was processed
    const [week6Status] = await connection.execute(`
      SELECT 
        qrss.week_number,
        qrss.qr_code_id,
        v.end_time,
        s.code,
        TIMESTAMPDIFF(MINUTE, v.end_time, NOW()) as minutes_since_expired
      FROM qr_code_study_session qrss
      JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235' AND qrss.week_number = 6
      ORDER BY v.end_time DESC
      LIMIT 1
    `);
    
    if (week6Status.length > 0) {
      const session = week6Status[0];
      console.log(`📚 Week 6 Session Status:`);
      console.log(`   QR Code: ${session.qr_code_id}`);
      console.log(`   Expired: ${session.minutes_since_expired} minutes ago`);
      console.log(`   Expired at: ${new Date(session.end_time).toLocaleTimeString()}`);
    }
    
    // Check email log table (if exists)
    console.log('\n📋 Checking email log records...');
    try {
      const [emailLogs] = await connection.execute(`
        SELECT * FROM email_log 
        WHERE recipient_email = 'sunard79@gmail.com'
        ORDER BY sent_at DESC
        LIMIT 5
      `);
      
      if (emailLogs.length > 0) {
        console.log(`   Found ${emailLogs.length} recent email log entries:`);
        emailLogs.forEach((log, i) => {
          console.log(`   ${i+1}. ${log.sent_at} - ${log.subject || 'N/A'} - Status: ${log.status || 'N/A'}`);
        });
      } else {
        console.log('   ❌ No email log entries found for sunard79@gmail.com');
      }
    } catch (e) {
      console.log('   ℹ️  Email log table may not exist or has different structure');
    }
    
    // Test SMTP connection directly
    console.log('\n🔧 TESTING SMTP CONNECTION...');
    
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER || 'dks695@uowmail.edu.au',
        pass: process.env.GMAIL_APP_PASSWORD || 'gqjv hvla axhb ziwz'
      }
    });
    
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      
      // Send a test email directly
      console.log('📧 Sending direct test email...');
      const testInfo = await transporter.sendMail({
        from: process.env.GMAIL_USER || 'dks695@uowmail.edu.au',
        to: 'sunard79@gmail.com',
        subject: 'Direct Test Email - CSCI235 Automatic System',
        html: `
          <h2>🎯 Direct Test Email</h2>
          <p>This is a direct test to verify email delivery is working.</p>
          <p>If you receive this, the SMTP configuration is correct.</p>
          <p>Time sent: ${new Date().toLocaleString()}</p>
        `
      });
      
      console.log('✅ Direct test email sent successfully!');
      console.log(`   Message ID: ${testInfo.messageId}`);
      console.log('   📧 Check sunard79@gmail.com inbox now');
      
    } catch (error) {
      console.log('❌ SMTP connection failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error checking email status:', error.message);
  } finally {
    await connection.end();
  }
}

checkEmailStatus();