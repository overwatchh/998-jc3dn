const mysql = require('mysql2/promise');

async function addLecture() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('📚 Creating CSCI235 Database Systems lecture...');
    
    const now = new Date();
    const startTime = new Date(now.getTime() - 2 * 60 * 1000); // Started 2 min ago
    const endTime = new Date(now.getTime() + 15 * 60 * 1000);  // Ends in 15 min
    
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    console.log(`📅 Lecture: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    
    // 1. Create study session
    const [sessionResult] = await connection.execute(
      'INSERT INTO study_session (type, start_time, end_time, room_id) VALUES (?, ?, ?, ?)',
      ['lecture', startTime, endTime, 1]
    );
    const studySessionId = sessionResult.insertId;
    console.log(`✅ Created study session (ID: ${studySessionId})`);
    
    // 2. Link to CSCI235 subject
    await connection.execute(
      'INSERT INTO subject_study_session (subject_id, study_session_id) VALUES (?, ?)',
      [3, studySessionId] // CSCI235 subject_id = 3
    );
    console.log('✅ Linked to CSCI235 subject');
    
    // 3. Create QR code
    const [qrResult] = await connection.execute(
      'INSERT INTO qr_code (createdAt, valid_radius) VALUES (NOW(), 50.0)'
    );
    const qrCodeId = qrResult.insertId;
    console.log(`📱 Created QR code (ID: ${qrCodeId})`);
    
    // 4. Create validity - ACTIVE NOW
    await connection.execute(
      'INSERT INTO validity (qr_code_id, start_time, end_time) VALUES (?, ?, ?)',
      [qrCodeId, startTime, endTime]
    );
    console.log('✅ Created ACTIVE validity');
    
    // 5. Link QR to study session
    await connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, studySessionId, 1]
    );
    console.log('🔗 Linked QR to study session');
    
    console.log('\n🎉 CSCI235 LECTURE CREATED!');
    console.log('===========================');
    console.log(`📱 QR Code: ${qrCodeId}`);
    console.log(`📍 Subject: CSCI235 Database Systems`);
    console.log(`📅 Week: 1`);
    console.log(`⏰ ACTIVE until: ${endTime.toLocaleTimeString()}`);
    console.log('🔄 Refresh your QR generation page to see it!');
    
  } catch (error) {
    console.error('❌ Error creating lecture:', error.message);
  } finally {
    await connection.end();
  }
}

addLecture();