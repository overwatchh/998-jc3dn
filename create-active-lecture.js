const mysql = require('mysql2/promise');

async function createActiveLecture() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 Creating ACTIVE CSCI235 lecture for testing...');
    
    const now = new Date();
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    
    // Create lecture that started 5 minutes ago and runs for 15 minutes total
    const startTime = new Date(now.getTime() - 5 * 60 * 1000); // Started 5 min ago
    const endTime = new Date(now.getTime() + 10 * 60 * 1000);   // Ends in 10 min
    
    console.log(`📅 Lecture timing: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    console.log(`🔥 CURRENTLY ACTIVE - you can scan and check in!`);
    console.log(`🎯 Will expire at: ${endTime.toLocaleTimeString()}`);
    
    // Clean up previous session
    console.log('\n🧹 Cleaning previous session...');
    const subjectId = 3; // CSCI235
    
    await connection.execute(`
      DELETE c FROM checkin c
      JOIN qr_code_study_session qrss ON c.qr_code_study_session_id = qrss.id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      WHERE sss.subject_id = ?
    `, [subjectId]);
    
    await connection.execute(`
      DELETE qrss FROM qr_code_study_session qrss
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      WHERE sss.subject_id = ?
    `, [subjectId]);
    
    await connection.execute(`
      DELETE v FROM validity v
      LEFT JOIN qr_code_study_session qrss ON v.qr_code_id = qrss.qr_code_id
      WHERE qrss.qr_code_id IS NULL
    `);
    
    // Create new QR code
    const [qrResult] = await connection.execute(
      'INSERT INTO qr_code (createdAt, valid_radius) VALUES (NOW(), 50.0)'
    );
    const qrCodeId = qrResult.insertId;
    console.log(`📱 Created new QR code (ID: ${qrCodeId})`);
    
    // Create validity record - ACTIVE NOW
    await connection.execute(
      'INSERT INTO validity (qr_code_id, start_time, end_time) VALUES (?, ?, ?)',
      [qrCodeId, startTime, endTime]
    );
    console.log(`✅ Created ACTIVE validity record`);
    
    // Link to CSCI235 study session
    const studySessionId = 18; // CSCI235 session
    const weekNumber = 5; // New week for this test
    
    await connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, studySessionId, weekNumber]
    );
    console.log(`🔗 Linked to CSCI235 Session ${studySessionId}, Week ${weekNumber}`);
    
    console.log('\n🎯 ACTIVE LECTURE READY FOR TESTING!');
    console.log('=======================================');
    console.log(`📱 QR Code ID: ${qrCodeId}`);
    console.log(`📍 Subject: CSCI235 Database Systems`);
    console.log(`📅 Week: ${weekNumber}`);
    console.log(`⏰ Active until: ${endTime.toLocaleTimeString()}`);
    console.log(`🔗 Visit: http://localhost:3001/qr-generation to see QR code`);
    console.log(`📧 Email reminder will be sent at: ${endTime.toLocaleTimeString()}`);
    console.log('\n👉 You can now scan the QR code and test check-in!');
    
  } catch (error) {
    console.error('❌ Error creating active lecture:', error.message);
  } finally {
    await connection.end();
  }
}

createActiveLecture();