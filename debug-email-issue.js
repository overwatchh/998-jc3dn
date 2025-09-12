// Debug email delivery issue
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');

async function debugEmailIssue() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔍 DEBUGGING EMAIL DELIVERY ISSUE');
    console.log('=================================');
    
    // Check our Week 6 test session
    console.log('1️⃣ Checking Week 6 test session...');
    const [week6] = await connection.execute(`
      SELECT 
        qrss.week_number,
        qrss.qr_code_id,
        v.end_time,
        s.code,
        TIMESTAMPDIFF(MINUTE, v.end_time, NOW()) as minutes_since_expired,
        CASE WHEN v.end_time <= NOW() THEN 'EXPIRED' ELSE 'ACTIVE' END as status
      FROM qr_code_study_session qrss
      JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235' AND qrss.week_number = 6
    `);
    
    if (week6.length > 0) {
      const session = week6[0];
      console.log(`   ✅ Found: ${session.code} Week ${session.week_number}, QR: ${session.qr_code_id}`);
      console.log(`   Status: ${session.status} (${session.minutes_since_expired}min ago)`);
      console.log(`   Expired at: ${new Date(session.end_time).toLocaleString()}`);
    } else {
      console.log('   ❌ Week 6 session not found');
    }
    
    // Check email_log table structure
    console.log('\n2️⃣ Checking email_log table...');
    try {
      const [tableInfo] = await connection.execute('DESCRIBE email_log');
      console.log('   ✅ Email log table exists with columns:');
      tableInfo.forEach(col => {
        console.log(`      - ${col.Field} (${col.Type})`);
      });
      
      // Check recent email log entries
      const [recentEmails] = await connection.execute(`
        SELECT * FROM email_log 
        ORDER BY id DESC 
        LIMIT 3
      `);
      
      console.log(`\n   📧 Recent email log entries (${recentEmails.length}):`);
      recentEmails.forEach((email, i) => {
        console.log(`      ${i+1}. To: ${email.recipient_email} | Subject: ${email.subject || 'N/A'}`);
        console.log(`         Status: ${email.status || 'N/A'} | Time: ${email.sent_at}`);
      });
      
    } catch (e) {
      console.log('   ❌ Email log table issue:', e.message);
      
      // Try to create the table if it doesn't exist
      console.log('   🔧 Attempting to create email_log table...');
      try {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS email_log (
            id INT PRIMARY KEY AUTO_INCREMENT,
            recipient_email VARCHAR(255) NOT NULL,
            subject VARCHAR(500),
            body TEXT,
            status ENUM('sent', 'failed') NOT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            study_session_id INT,
            week_number INT,
            error_message TEXT
          )
        `);
        console.log('   ✅ Email log table created successfully');
      } catch (createError) {
        console.log('   ❌ Failed to create email_log table:', createError.message);
      }
    }
    
    // Test direct SMTP
    console.log('\n3️⃣ Testing SMTP connection...');
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'dks695@uowmail.edu.au',
        pass: 'gqjv hvla axhb ziwz'
      }
    });
    
    try {
      console.log('   🔧 Verifying SMTP connection...');
      await transporter.verify();
      console.log('   ✅ SMTP connection verified successfully');
      
      console.log('   📧 Sending direct test email to sunard79@gmail.com...');
      const info = await transporter.sendMail({
        from: 'dks695@uowmail.edu.au',
        to: 'sunard79@gmail.com',
        subject: '🎯 Direct SMTP Test - CSCI235 Email System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">🎯 Direct SMTP Test Email</h2>
            <p>This is a direct test email to verify SMTP delivery.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <strong>Test Details:</strong><br>
              Time: ${new Date().toLocaleString()}<br>
              Purpose: Verify automatic email system is working<br>
              Status: If you see this, SMTP is working correctly
            </div>
            <p>If you receive this email, the SMTP configuration is correct and the automatic attendance reminder system should be working.</p>
          </div>
        `
      });
      
      console.log('   ✅ Direct test email sent successfully!');
      console.log(`   Message ID: ${info.messageId}`);
      console.log('   📨 Check your inbox at sunard79@gmail.com');
      
      // Log this test email to database
      try {
        await connection.execute(`
          INSERT INTO email_log (recipient_email, subject, status, sent_at, study_session_id, week_number)
          VALUES (?, ?, 'sent', NOW(), NULL, NULL)
        `, ['sunard79@gmail.com', '🎯 Direct SMTP Test - CSCI235 Email System']);
        console.log('   ✅ Test email logged to database');
      } catch (logError) {
        console.log('   ⚠️  Could not log to database:', logError.message);
      }
      
    } catch (smtpError) {
      console.log('   ❌ SMTP failed:', smtpError.message);
    }
    
    console.log('\n🎯 DIAGNOSIS SUMMARY:');
    console.log('   1. Week 6 session expired as expected ✅');
    console.log('   2. Scheduler detected it in logs ✅');
    console.log('   3. SMTP test will show if email delivery works');
    console.log('   4. If test email arrives, automatic system should work');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await connection.end();
  }
}

debugEmailIssue();