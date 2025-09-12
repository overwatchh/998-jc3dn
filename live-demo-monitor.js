// Live demo monitor - triggers email immediately when lecture expires
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

class LiveDemoMonitor {
  constructor() {
    this.connection = null;
    this.transporter = null;
    this.monitoring = false;
    this.checkInterval = null;
  }

  async initialize() {
    // Setup database connection
    this.connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Deepak7314@',
      database: 'qr_attendance_app'
    });

    // Setup email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    console.log('🎯 LIVE DEMO MONITOR INITIALIZED');
    console.log('===============================');
    console.log('✅ Database connected');
    console.log('✅ Email system ready');
  }

  async setupQuickTest() {
    console.log('\n🚀 SETTING UP INSTANT DEMO TEST');
    console.log('==============================');

    // Clean previous test data
    await this.connection.execute('DELETE FROM email_log WHERE sent_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)');
    
    // Remove recent QR sessions
    await this.connection.execute(`
      DELETE qrss FROM qr_code_study_session qrss
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      WHERE sss.subject_id = 3 AND qrss.week_number >= 8
    `);

    // Clean orphaned validity records
    await this.connection.execute(`
      DELETE v FROM validity v
      LEFT JOIN qr_code_study_session qrss ON v.qr_code_id = qrss.qr_code_id
      WHERE qrss.qr_code_id IS NULL
    `);

    // Setup new test that expires in 1 minute for instant demo
    const now = new Date();
    const startTime = new Date(now);
    startTime.setMinutes(startTime.getMinutes() - 5); // Started 5 min ago

    const endTime = new Date(now);
    endTime.setMinutes(endTime.getMinutes() + 1); // Expires in 1 minute!

    // Create QR code
    const [qrResult] = await this.connection.execute(
      'INSERT INTO qr_code (createdAt, valid_radius) VALUES (NOW(), 50.0)'
    );
    const qrCodeId = qrResult.insertId;

    // Create validity
    await this.connection.execute(
      'INSERT INTO validity (qr_code_id, start_time, end_time) VALUES (?, ?, ?)',
      [qrCodeId, startTime, endTime]
    );

    // Link to CSCI235 Week 9
    await this.connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, 18, 9]
    );

    // Update display timing
    const startTimeStr = startTime.toTimeString().substr(0, 8);
    const endTimeStr = endTime.toTimeString().substr(0, 8);
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });

    await this.connection.execute(
      'UPDATE study_session SET start_time = ?, end_time = ?, day_of_week = ? WHERE id = 18',
      [startTimeStr, endTimeStr, today]
    );

    console.log(`⏰ Lecture expires at: ${endTime.toLocaleTimeString()}`);
    console.log(`📱 QR Code ID: ${qrCodeId}`);
    console.log(`📅 Week: 9 (Fresh test)`);
    console.log('✅ Demo test ready!');

    return { qrCodeId, endTime };
  }

  async startMonitoring(qrCodeId, endTime) {
    console.log('\n👀 STARTING LIVE MONITORING');
    console.log('==========================');
    console.log('🎯 Checking every 5 seconds for expiry...');

    this.monitoring = true;
    let lastStatus = null;

    this.checkInterval = setInterval(async () => {
      try {
        const now = new Date();
        const secondsRemaining = Math.floor((endTime - now) / 1000);

        if (secondsRemaining > 0) {
          const minutes = Math.floor(secondsRemaining / 60);
          const seconds = secondsRemaining % 60;
          const status = `⏳ ${minutes}m ${seconds}s remaining`;
          
          if (status !== lastStatus) {
            console.log(`${new Date().toLocaleTimeString()} - ${status}`);
            lastStatus = status;
          }
        } else {
          // LECTURE EXPIRED! Send email immediately
          console.log(`\n🚨 ${new Date().toLocaleTimeString()} - LECTURE EXPIRED!`);
          console.log('📧 SENDING EMAIL IMMEDIATELY...');

          await this.sendImmediateEmail();
          
          console.log('\n✅ LIVE DEMO COMPLETE!');
          console.log('======================');
          console.log('📧 Check sunard79@gmail.com - email sent instantly!');
          
          this.stopMonitoring();
        }
      } catch (error) {
        console.error('❌ Error during monitoring:', error.message);
      }
    }, 5000); // Check every 5 seconds
  }

  async sendImmediateEmail() {
    const emailData = {
      studentName: 'Student321',
      studentEmail: 'sunard79@gmail.com',
      subjectName: 'Computer Science Fundamentals',
      subjectCode: 'CSCI235',
      weekNumber: 9,
      attendancePercentage: 0, // They didn't check in
      checkinCount: 0,
      totalAttendancePercentage: 75.5,
      classesCanMiss: 2,
      isLowAttendance: false
    };

    const subject = `📊 INSTANT DEMO: Attendance Update - ${emailData.subjectCode} Week ${emailData.weekNumber}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">🎯 LIVE DEMO - Automatic Email System</h2>
        
        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <strong>✅ SUCCESS: Email sent instantly when lecture expired!</strong>
        </div>
        
        <h3>Week ${emailData.weekNumber} Attendance Summary</h3>
        <p><strong>Subject:</strong> ${emailData.subjectName} (${emailData.subjectCode})</p>
        <p><strong>Student:</strong> ${emailData.studentName}</p>
        <p><strong>Your attendance:</strong> 
          <span style="background: #fecaca; color: #991b1b; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
            Absent (0%)
          </span>
        </p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <strong>Overall Attendance: ${emailData.totalAttendancePercentage}%</strong><br>
          <strong>Classes you can still miss: ${emailData.classesCanMiss}</strong>
        </div>
        
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #166534; margin-top: 0;">🎪 LIVE DEMO SUCCESS!</h3>
          <p>This email was sent <strong>immediately</strong> when the lecture time expired.</p>
          <p>Perfect for live presentations and demos!</p>
        </div>
        
        <p><small>Demo sent at: ${new Date().toLocaleString()}</small></p>
      </div>
    `;

    const info = await this.transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: emailData.studentEmail,
      subject: subject,
      html: htmlContent
    });

    // Log to database
    await this.connection.execute(`
      INSERT INTO email_log (study_session_id, week_number, student_id, student_email, success, sent_at)
      VALUES (18, 9, 'Lu7Q8RPLJQW6SzqWfMYvV45PGDXLg0gh', ?, TRUE, NOW())
    `, [emailData.studentEmail]);

    console.log(`✅ Email sent instantly! Message ID: ${info.messageId}`);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.monitoring = false;
    
    // Close connections after a delay
    setTimeout(() => {
      if (this.connection) {
        this.connection.end();
      }
      console.log('🎯 Monitor stopped. Demo complete!');
      process.exit(0);
    }, 2000);
  }
}

// Run the live demo
async function runLiveDemo() {
  const monitor = new LiveDemoMonitor();
  
  try {
    await monitor.initialize();
    const { qrCodeId, endTime } = await monitor.setupQuickTest();
    await monitor.startMonitoring(qrCodeId, endTime);
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

runLiveDemo();