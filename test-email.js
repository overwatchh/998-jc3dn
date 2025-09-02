const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testEmailConnection() {
  console.log('🔧 Testing email service connection...');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log('✅ Email service connection successful!');
    
    // Send a test email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to yourself
      subject: 'QR Attendance System - Email Test',
      text: 'This is a test email from your QR Attendance System. Email service is working correctly!',
      html: '<h2>✅ Email Service Test</h2><p>This is a test email from your QR Attendance System. Email service is working correctly!</p>'
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
    console.log('\n📝 Common solutions:');
    console.log('1. Use App Password for Gmail (not your regular password)');
    console.log('2. Enable 2-factor authentication and generate App Password');
    console.log('3. Check your SMTP_USER and SMTP_PASS in .env.local');
  }
}

testEmailConnection();