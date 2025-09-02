const nodemailer = require('nodemailer');

async function setupTestEmail() {
  console.log('🔧 Setting up test email account...');
  
  // Create a test account with Ethereal Email
  const testAccount = await nodemailer.createTestAccount();
  
  console.log('✅ Test email account created!');
  console.log('\n📧 Email Configuration:');
  console.log('Host:', testAccount.smtp.host);
  console.log('Port:', testAccount.smtp.port);
  console.log('User:', testAccount.user);
  console.log('Pass:', testAccount.pass);
  
  console.log('\n📝 Add these to your .env.local:');
  console.log(`SMTP_HOST=${testAccount.smtp.host}`);
  console.log(`SMTP_PORT=${testAccount.smtp.port}`);
  console.log(`SMTP_SECURE=false`);
  console.log(`SMTP_USER=${testAccount.user}`);
  console.log(`SMTP_PASS=${testAccount.pass}`);
  console.log(`SMTP_FROM_EMAIL=${testAccount.user}`);
  
  // Test sending an email
  console.log('\n🧪 Testing email sending...');
  
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  
  const info = await transporter.sendMail({
    from: testAccount.user,
    to: testAccount.user,
    subject: 'Test Email - QR Attendance System',
    text: 'This is a test email from your QR Attendance System!',
    html: '<h2>✅ Test Email</h2><p>This is a test email from your QR Attendance System!</p>'
  });
  
  console.log('✅ Email sent successfully!');
  console.log('Message ID:', info.messageId);
  console.log('\n📨 Preview URL:', nodemailer.getTestMessageUrl(info));
  console.log('\n👆 Click the URL above to see your test email in a web browser!');
}

setupTestEmail().catch(console.error);