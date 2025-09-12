// Create a test lecture ready for automatic email demo
const mysql = require('mysql2/promise');

async function createTestLecture() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('📚 CREATING TEST LECTURE');
    console.log('=======================');
    
    const now = new Date();
    
    // Create lecture that expires in 4 minutes
    const startTime = new Date(now);
    startTime.setMinutes(startTime.getMinutes() - 10); // Started 10 min ago
    
    const endTime = new Date(now);
    endTime.setMinutes(endTime.getMinutes() + 4); // Expires in 4 minutes
    
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    console.log(`📅 Lecture: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    console.log(`🎯 Expires in: 4 minutes at ${endTime.toLocaleTimeString()}`);
    
    // Create QR code
    const [qrResult] = await connection.execute(
      'INSERT INTO qr_code (createdAt, valid_radius) VALUES (NOW(), 50.0)'
    );
    const qrCodeId = qrResult.insertId;
    
    // Create validity
    await connection.execute(
      'INSERT INTO validity (qr_code_id, start_time, end_time) VALUES (?, ?, ?)',
      [qrCodeId, startTime, endTime]
    );
    
    // Link to CSCI235 Week 12
    await connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, 18, 12]
    );
    
    // Update display timing
    const displayStartTime = new Date(now);
    displayStartTime.setMinutes(displayStartTime.getMinutes() - 10);
    
    const displayEndTime = new Date(now);
    displayEndTime.setMinutes(displayEndTime.getMinutes() + 4);
    
    const startTimeStr = displayStartTime.toTimeString().substr(0, 8);
    const endTimeStr = displayEndTime.toTimeString().substr(0, 8);
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    await connection.execute(
      'UPDATE study_session SET start_time = ?, end_time = ?, day_of_week = ? WHERE id = 18',
      [startTimeStr, endTimeStr, today]
    );
    
    const emailTime = new Date(endTime.getTime() + 2*60*1000); // 2 minutes after expiry
    
    console.log(`📱 QR Code: ${qrCodeId}`);
    console.log(`📅 Week: 12`);
    console.log(`📧 Email expected: ~${emailTime.toLocaleTimeString()}`);
    console.log(`📺 Display updated: ${today} ${displayStartTime.toLocaleTimeString()} - ${displayEndTime.toLocaleTimeString()}`);
    
    console.log('\n✅ TEST LECTURE READY!');
    console.log('=====================');
    console.log('🎯 Timeline:');
    console.log(`   ${endTime.toLocaleTimeString()} - Lecture expires`);
    console.log(`   ${emailTime.toLocaleTimeString()} - Email arrives`);
    console.log('📧 Check sunard79@gmail.com');
    console.log('🌐 View at: http://localhost:3005');
    
  } catch (error) {
    console.error('❌ Error creating test lecture:', error.message);
  } finally {
    await connection.end();
  }
}

createTestLecture();