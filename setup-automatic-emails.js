const mysql = require('mysql2/promise');

// For production, you would set up a proper cron job or systemd timer
// This is a development solution to demonstrate automatic email sending

async function setupAutomaticEmails() {
  console.log('🚀 Setting up automatic email reminders...');
  console.log('⏰ This will check for expired QR codes every 60 seconds');
  console.log('📧 Emails will be sent automatically when QR codes expire');
  console.log('');
  
  const smtpConfig = {
    system_key: "attendance_email_system_2024",
    smtp_config: {
      smtp_host: "smtp.gmail.com",
      smtp_port: 587,
      smtp_user: "qrattendancesystem2025@gmail.com",
      smtp_pass: "xjid lkdd adro kvrx",
      from_email: "qrattendancesystem2025@gmail.com",
      from_name: "QR Attendance System"
    },
    minutes_after_expiry: 0
  };

  // Function to check and send emails
  async function checkAndSendEmails() {
    try {
      const response = await fetch('http://localhost:3002/api/system/auto-email-trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(smtpConfig)
      });

      const result = await response.json();
      
      if (result.total_emails_sent > 0) {
        console.log(`📧 ${new Date().toLocaleTimeString()}: Sent ${result.total_emails_sent} emails`);
        result.sessions.forEach(session => {
          console.log(`   → ${session.subject_code} Week ${session.week_number}: ${session.emails_sent} emails`);
        });
      } else {
        console.log(`✅ ${new Date().toLocaleTimeString()}: No expired sessions found`);
      }
    } catch (error) {
      console.error(`❌ ${new Date().toLocaleTimeString()}: Email check failed:`, error.message);
    }
  }

  // Check immediately
  console.log('🔍 Running initial check...');
  await checkAndSendEmails();
  
  // Set up automatic checking every 60 seconds
  console.log('⏰ Starting automatic email scheduler (every 60 seconds)');
  console.log('Press Ctrl+C to stop\n');
  
  const intervalId = setInterval(checkAndSendEmails, 60000); // 60 seconds

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping automatic email scheduler...');
    clearInterval(intervalId);
    process.exit(0);
  });
}

// For production deployment, you would use:
// 1. A proper cron job: */1 * * * * (every minute)
// 2. Or systemd timer
// 3. Or container orchestrator scheduling
// 4. Or cloud function triggers

console.log('🎯 PRODUCTION DEPLOYMENT OPTIONS:');
console.log('1. Linux Cron: */1 * * * * curl -X POST http://localhost:3002/api/system/auto-email-trigger ...');
console.log('2. Windows Task Scheduler: Every 1 minute');
console.log('3. Docker with cron container');
console.log('4. Cloud functions (AWS Lambda, Google Cloud Functions)');
console.log('5. Kubernetes CronJob');
console.log('');

setupAutomaticEmails();