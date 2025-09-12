// Test script to verify email functionality
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🧪 Testing email system...');
  
  // Your Gmail configuration
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'qrattendancesystem2025@gmail.com',
      pass: 'xjid lkdd adro kvrx',
    },
  });

  try {
    // Verify connection
    console.log('📡 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    // Send test email
    console.log('📧 Sending test attendance reminder email...');
    const info = await transporter.sendMail({
      from: '"QR Attendance System" <qrattendancesystem2025@gmail.com>',
      to: 'qrattendancesystem2025@gmail.com', // Send to yourself for testing
      subject: '📊 Test Attendance Reminder - QR System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">📊 Attendance Test Email</h2>
          <p><strong>This is a test email from your QR Attendance System!</strong></p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Test Data:</h3>
            <p><strong>Student:</strong> Test Student</p>
            <p><strong>Subject:</strong> Computer Science 101</p>
            <p><strong>Attendance Status:</strong> <span style="color: #ef4444;">Low Attendance (45%)</span></p>
            <p><strong>Action Required:</strong> Please improve attendance</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This email was sent automatically by the QR Attendance System at ${new Date().toLocaleString()}
          </p>
        </div>
      `
    });

    console.log('🎉 Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📨 Email sent to: qrattendancesystem2025@gmail.com');
    console.log('\n✅ ATTENDANCE EMAIL SYSTEM IS WORKING PERFECTLY!');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

testEmail();