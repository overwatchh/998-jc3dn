const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function sendTestEmailWithPreview() {
  console.log('📧 Sending a test email to get preview URL...');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  
  // Send a sample attendance reminder email
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    to: 'john.doe@test.com',
    subject: 'Critical: Attendance Below Threshold - Computer Science Fundamentals',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545;">
          <h2 style="color: #721c24; margin-top: 0;">🚨 Critical: Attendance Below Threshold</h2>
          
          <p>Dear John Doe,</p>
          
          <p><strong>URGENT NOTICE:</strong> Your attendance for Computer Science Fundamentals has fallen below the required 80% threshold.</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border: 2px solid #dc3545;">
            <h3 style="margin-top: 0; color: #721c24;">Final Attendance Status</h3>
            <p><strong>Course:</strong> Computer Science Fundamentals (CS101)</p>
            <p><strong>Session Type:</strong> Lecture</p>
            <p><strong>Sessions Attended:</strong> 6 out of 10</p>
            <p style="color: #dc3545; font-size: 18px;"><strong>Final Attendance Rate: 60.0%</strong></p>
            <p style="color: #dc3545;"><strong>⚠️ Status:</strong> Below Required 80% Threshold</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffc107;">
            <h4 style="margin-top: 0; color: #856404;">Immediate Actions Required:</h4>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Contact your lecturer immediately</strong> to discuss your situation</li>
              <li>Report any attendance discrepancies or errors in recording</li>
              <li>Provide documentation for any medical or emergency absences</li>
              <li>Schedule a meeting with your academic advisor</li>
            </ol>
          </div>
          
          <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #bee5eb;">
            <h4 style="margin-top: 0; color: #0c5460;">Lecturer Contact Information:</h4>
            <p><strong>Name:</strong> Dr. Professor</p>
            <p><strong>Email:</strong> professor@test.com</p>
            <p><em>Your lecturer has been copied on this notification.</em></p>
          </div>
          
          <p style="color: #721c24;"><strong>Please note:</strong> This attendance deficiency may result in academic consequences as outlined in the course syllabus and university policies.</p>
          
          <p>Take immediate action to address this situation. Time is critical.</p>
          
          <p>Best regards,<br>Academic Administration</p>
        </div>
      </div>
    `,
    text: `
      🚨 CRITICAL: ATTENDANCE BELOW THRESHOLD
      
      Dear John Doe,
      
      URGENT: Your attendance for Computer Science Fundamentals has fallen below the required 80% threshold.
      
      Final Status:
      - Course: Computer Science Fundamentals (CS101)
      - Session Type: Lecture
      - Attended: 6 out of 10 sessions
      - Final Attendance Rate: 60.0%
      - Status: BELOW REQUIRED 80% THRESHOLD
      
      IMMEDIATE ACTIONS REQUIRED:
      1. Contact your lecturer immediately: Dr. Professor (professor@test.com)
      2. Report any attendance discrepancies
      3. Provide documentation for medical/emergency absences
      4. Schedule meeting with academic advisor
      
      This may result in academic consequences. Take immediate action.
      
      Academic Administration
    `
  });
  
  console.log('✅ Test email sent!');
  console.log('📨 Direct Preview URL:', nodemailer.getTestMessageUrl(info));
  console.log('\n🔗 Or visit the general inbox: https://ethereal.email/messages');
  console.log('📧 Search for emails from:', process.env.SMTP_USER);
}

sendTestEmailWithPreview().catch(console.error);