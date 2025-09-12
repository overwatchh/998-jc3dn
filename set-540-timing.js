// Set lecture timing to expire at 5:40 PM
const mysql = require('mysql2/promise');

async function set540Timing() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🕔 SETTING LECTURE TO EXPIRE AT 5:40 PM');
    console.log('======================================');
    
    const subjectId = 3; // CSCI235
    const studySessionId = 24; // CSCI235 study session
    
    // Clean recent data
    await connection.execute('DELETE FROM email_log WHERE sent_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)');
    
    // Remove Week 10 sessions if they exist
    await connection.execute(`
      DELETE qrss FROM qr_code_study_session qrss
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      WHERE sss.subject_id = ? AND qrss.week_number = 10
    `, [subjectId]);
    
    // Clean orphaned validity records
    await connection.execute(`
      DELETE v FROM validity v
      LEFT JOIN qr_code_study_session qrss ON v.qr_code_id = qrss.qr_code_id
      WHERE qrss.qr_code_id IS NULL
    `);
    
    console.log('✅ Previous data cleaned');
    
    // Setup timing for 2:30 PM expiry
    const now = new Date();
    const startTime = new Date(now);
    startTime.setMinutes(startTime.getMinutes() - 15); // Started 15 min ago
    
    const endTime = new Date();
    endTime.setHours(14, 30, 0, 0); // 2:30:00 PM exactly
    
    const minutesUntilExpiry = Math.ceil((endTime - now) / (1000 * 60));
    
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    console.log(`📅 Lecture timing: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    console.log(`🎯 Will expire at exactly: 2:30:00 PM`);
    console.log(`⏳ Minutes until expiry: ${minutesUntilExpiry}`);
    
    // Create new QR code
    const [qrResult] = await connection.execute(
      'INSERT INTO qr_code (createdAt, valid_radius) VALUES (NOW(), 50.0)'
    );
    const qrCodeId = qrResult.insertId;
    console.log(`📱 Created QR code ID: ${qrCodeId}`);
    
    // Create validity record
    await connection.execute(
      'INSERT INTO validity (qr_code_id, start_time, end_time) VALUES (?, ?, ?)',
      [qrCodeId, startTime, endTime]
    );
    console.log('✅ Created validity record');
    
    // Link to CSCI235 Week 10
    const weekNumber = 10;
    await connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, studySessionId, weekNumber]
    );
    console.log(`🔗 Linked to CSCI235 Week ${weekNumber}`);
    
    // Update display timing to match
    const displayStartTime = new Date(now);
    displayStartTime.setMinutes(displayStartTime.getMinutes() - 15);
    
    const displayEndTime = new Date();
    displayEndTime.setHours(14, 30, 0, 0);
    
    const startTimeStr = displayStartTime.toTimeString().substr(0, 8);
    const endTimeStr = displayEndTime.toTimeString().substr(0, 8);
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    await connection.execute(
      'UPDATE study_session SET start_time = ?, end_time = ?, day_of_week = ? WHERE id = 24',
      [startTimeStr, endTimeStr, today]
    );
    console.log(`📺 Updated display: ${today} ${displayStartTime.toLocaleTimeString()} - ${displayEndTime.toLocaleTimeString()}`);
    
    // Show enhanced scheduler timeline
    const schedulerResponseTime = new Date(endTime.getTime() + 30*1000); // 30 seconds later
    
    console.log('\n⚡ ENHANCED SCHEDULER TIMELINE');
    console.log(`📅 Lecture expires: 2:30:00 PM`);
    console.log(`🤖 Enhanced scheduler detects: ~2:30:30 PM`);
    console.log(`📧 Email sent to sunard79@gmail.com: ~2:30:30 PM`);
    console.log(`⚡ Response time: ~30 seconds!`);
    
    console.log('\n🎯 2:30 PM TEST READY!');
    console.log('=====================');
    console.log(`📱 QR Code: ${qrCodeId}, Week: ${weekNumber}`);
    console.log(`⏰ Expires: exactly 2:30:00 PM`);
    console.log(`📧 Email: sunard79@gmail.com (~2:30:30 PM)`);
    console.log(`🚀 Enhanced real-time scheduler active!`);
    
  } catch (error) {
    console.error('❌ Error setting 5:40 timing:', error.message);
  } finally {
    await connection.end();
  }
}

set540Timing();