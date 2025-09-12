const mysql = require('mysql2/promise');

async function fixQRDisplay() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 Creating fresh CSCI235 lecture that will show on QR page...');
    
    const now = new Date();
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    
    // Set times for ACTIVE lecture
    const startTime = new Date(now.getTime() - 2 * 60 * 1000); // Started 2 min ago
    const endTime = new Date(now.getTime() + 10 * 60 * 1000); // Ends in 10 min
    
    console.log(`📅 Lecture: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    
    // Create new QR code
    const [qrResult] = await connection.execute(
      'INSERT INTO qr_code (createdAt, valid_radius) VALUES (NOW(), 50.0)'
    );
    const qrCodeId = qrResult.insertId;
    console.log(`📱 Created QR code: ${qrCodeId}`);
    
    // Create validity - CURRENTLY ACTIVE
    await connection.execute(
      'INSERT INTO validity (qr_code_id, start_time, end_time) VALUES (?, ?, ?)',
      [qrCodeId, startTime, endTime]
    );
    console.log('✅ Created ACTIVE validity');
    
    // Link to existing CSCI235 study session
    const studySessionId = 19; // From our fresh setup
    const weekNumber = 2; // Use week 2 to avoid duplicate
    
    await connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, studySessionId, weekNumber]
    );
    console.log('🔗 Linked to CSCI235 study session');
    
    console.log('\n🎯 ACTIVE CSCI235 LECTURE READY!');
    console.log(`📱 QR Code: ${qrCodeId}`);
    console.log(`⏰ Active until: ${endTime.toLocaleTimeString()}`);
    console.log('📍 This should now appear at the top of your QR generation page');
    console.log('🔄 Refresh http://localhost:3001/qr-generation to see it');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixQRDisplay();