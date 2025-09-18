#!/usr/bin/env node

/**
 * Email Reminder Demo Script
 * Run this to test the email reminder system for your supervisor demo
 */

const BASE_URL = 'http://localhost:3000';

// Configuration - Update these with your email settings
const EMAIL_CONFIG = {
  smtp_host: "smtp.gmail.com",
  smtp_port: 587,
  smtp_user: "your-email@gmail.com", // Replace with your email
  smtp_pass: "your-app-password",    // Replace with your Gmail app password
  from_email: "your-email@gmail.com", // Replace with your email
  from_name: "QR Attendance Demo System"
};

// Test parameters - Update these based on your test data
const TEST_PARAMS = {
  study_session_id: 200, // Replace with actual session ID
  week_number: 1         // Current week number
};

async function testEmailReminder() {
  console.log('🎯 Testing Email Reminder System');
  console.log('==================================');

  try {
    const response = await fetch(`${BASE_URL}/api/lecturer/send-attendance-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      },
      body: JSON.stringify({
        study_session_id: TEST_PARAMS.study_session_id,
        week_number: TEST_PARAMS.week_number,
        smtp_config: EMAIL_CONFIG
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Email Reminder Test Successful!');
      console.log(`📧 Emails sent: ${result.emails_sent}`);
      console.log(`❌ Failed emails: ${result.failed_emails}`);
      console.log(`👥 Total students: ${result.total_students}`);
      console.log(`📚 Subject: ${result.subject}`);
      console.log(`📅 Week: ${result.week_number}`);

      if (result.results && result.results.length > 0) {
        console.log('\n📋 Email Results:');
        result.results.forEach((emailResult, index) => {
          const status = emailResult.success ? '✅' : '❌';
          console.log(`  ${index + 1}. ${status} ${emailResult.studentEmail}`);
          if (emailResult.error) {
            console.log(`     Error: ${emailResult.error}`);
          }
        });
      }
    } else {
      console.log('❌ Email Reminder Test Failed');
      console.log(`Status: ${response.status}`);
      console.log(`Error: ${result.message}`);
      if (result.errors) {
        console.log('Validation errors:', result.errors);
      }
    }

  } catch (error) {
    console.error('🚨 Network Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('  1. The development server is running (npm run dev)');
    console.log('  2. You are logged in as a lecturer');
    console.log('  3. The study session ID exists');
    console.log('  4. Your email configuration is correct');
  }
}

async function testSystemTrigger() {
  console.log('\n🤖 Testing System Auto-Trigger');
  console.log('================================');

  try {
    const response = await fetch(`${BASE_URL}/api/system/lecture-end-trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        study_session_id: TEST_PARAMS.study_session_id,
        week_number: TEST_PARAMS.week_number,
        system_key: "attendance_email_system_2024" // Default system key
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ System Trigger Test Successful!');
      console.log(`📧 Emails sent: ${result.emails_sent}`);
      console.log(`📚 Subject: ${result.subject}`);
      console.log(`⏰ Processed at: ${result.processed_at}`);
    } else {
      console.log('ℹ️ System Trigger Response:');
      console.log(`Status: ${response.status}`);
      console.log(`Message: ${result.message}`);

      if (result.active_qr_codes) {
        console.log(`⏳ QR codes still active: ${result.active_qr_codes}/${result.total_qr_codes}`);
        console.log('💡 Wait for all QR codes to expire before auto-trigger works');
      }
    }

  } catch (error) {
    console.error('🚨 System Trigger Error:', error.message);
  }
}

// Run the tests
console.log('📧 Email Reminder Demo Starting...\n');

// Update configuration reminder
if (EMAIL_CONFIG.smtp_user === "your-email@gmail.com") {
  console.log('⚠️  IMPORTANT: Update EMAIL_CONFIG with your actual email settings!');
  console.log('   - smtp_user: Your Gmail address');
  console.log('   - smtp_pass: Your Gmail App Password (not regular password)');
  console.log('   - from_email: Your Gmail address\n');
}

testEmailReminder()
  .then(() => testSystemTrigger())
  .then(() => {
    console.log('\n🎉 Demo Complete!');
    console.log('\n💡 For your supervisor demo:');
    console.log('   1. Start a lecture session and generate QR codes');
    console.log('   2. Have some test students scan the QR codes');
    console.log('   3. Run this script to send attendance reminder emails');
    console.log('   4. Show the email results and any received emails');
  });