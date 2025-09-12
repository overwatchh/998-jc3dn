// Test SMTP with correct credentials from .env.local
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testCorrectSMTP() {
  console.log('📧 TESTING SMTP WITH CORRECT CREDENTIALS');
  console.log('=======================================');
  
  console.log('🔧 Email Configuration:');
  console.log(`   SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`   SMTP Port: ${process.env.SMTP_PORT}`);
  console.log(`   SMTP User: ${process.env.SMTP_USER}`);
  console.log(`   From Email: ${process.env.FROM_EMAIL}`);
  console.log(`   From Name: ${process.env.FROM_NAME}`);
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  
  try {
    console.log('\n🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    
    console.log('\n📧 Sending test email to sunard79@gmail.com...');
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: 'sunard79@gmail.com',
      subject: '🎯 SMTP Test - Automatic Attendance System Working',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">🎯 SMTP Connection Test - SUCCESS!</h2>
          
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong>✅ Email System Status: WORKING</strong>
          </div>
          
          <p>This confirms that:</p>
          <ul>
            <li>✅ SMTP credentials are correct</li>
            <li>✅ Email delivery is working</li>
            <li>✅ The automatic attendance reminder system should be functional</li>
          </ul>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong>Test Details:</strong><br>
            Time: ${new Date().toLocaleString()}<br>
            From: ${process.env.FROM_EMAIL}<br>
            System: QR Attendance Automatic Email System
          </div>
          
          <p>Since you're receiving this email, the automatic attendance reminder system should be working correctly!</p>
        </div>
      `
    });
    
    console.log('✅ TEST EMAIL SENT SUCCESSFULLY!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log('   📨 Check your inbox at sunard79@gmail.com');
    console.log('\n🎯 CONCLUSION: If you receive this test email, the automatic attendance system should work');
    
  } catch (error) {
    console.log('❌ SMTP Test Failed:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Troubleshooting Gmail SMTP:');
      console.log('   1. Verify the Gmail app password is correct');
      console.log('   2. Make sure 2FA is enabled on the Gmail account');
      console.log('   3. Check if "Less secure app access" needs to be enabled');
      console.log('   4. Verify the email account qrattendancesystem2025@gmail.com exists');
    }
  }
}

testCorrectSMTP();