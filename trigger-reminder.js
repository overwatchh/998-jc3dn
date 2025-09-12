// Trigger the attendance reminder system
const fetch = require('node-fetch');

async function triggerReminder() {
  console.log('🚀 Triggering attendance reminder system...');
  
  try {
    const response = await fetch('http://localhost:3000/api/system/auto-email-trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_key: 'attendance_email_system_2024',
        minutes_after_expiry: 60, // Look for sessions expired in last 60 minutes
        smtp_config: {
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          smtp_user: 'qrattendancesystem2025@gmail.com',
          smtp_pass: 'xjid lkdd adro kvrx',
          from_email: 'qrattendancesystem2025@gmail.com',
          from_name: 'QR Attendance System'
        }
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Attendance reminder system response:');
      console.log(`📧 Total emails sent: ${result.total_emails_sent}`);
      console.log(`❌ Failed emails: ${result.total_failed_emails}`);
      console.log(`📊 Processed sessions: ${result.processed_sessions}`);
      
      if (result.sessions && result.sessions.length > 0) {
        console.log('\n📋 Session details:');
        result.sessions.forEach(session => {
          console.log(`  - ${session.subject_name} (${session.subject_code})`);
          console.log(`    Study Session: ${session.study_session_id}, Week: ${session.week_number}`);
          console.log(`    Emails sent: ${session.emails_sent}, Failed: ${session.failed_emails}`);
        });
      }
      
      console.log(`\n🎯 Processed at: ${result.processed_at}`);
      
      if (result.total_emails_sent > 0) {
        console.log('\n🎉 SUCCESS! Attendance reminder emails have been sent!');
        console.log('📧 Check sunard79@gmail.com for the attendance reminder email.');
      } else {
        console.log('\n⚠️  No emails were sent. This could be because:');
        console.log('   - No students found with low attendance');
        console.log('   - No expired sessions within the time window');
        console.log('   - Students may not be properly enrolled');
      }
      
    } else {
      console.error('❌ API Error:', result.message);
      if (result.error) {
        console.error('   Error details:', result.error);
      }
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

triggerReminder();