const mysql = require('mysql2/promise');

async function create5MinTestLecture() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🆕 Creating 5-minute test lecture...');
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const startTime = new Date(now.getTime() - 1 * 60 * 1000); // Started 1 min ago
    const endTime = new Date(now.getTime() + 5 * 60 * 1000);   // Ends in 5 min
    const startTimeStr = startTime.toTimeString().split(' ')[0].slice(0, 5); // HH:MM
    const endTimeStr = endTime.toTimeString().split(' ')[0].slice(0, 5); // HH:MM
    
    console.log(`📅 Day: ${currentDay}`);
    console.log(`⏰ Start: ${startTimeStr} (1 minute ago)`);
    console.log(`⏰ End: ${endTimeStr} (in 5 minutes)`);
    console.log(`🎯 Email will be sent after ${endTime.toLocaleTimeString()}`);
    
    // Create study session
    const [sessionResult] = await connection.execute(
      'INSERT INTO study_session (day_of_week, start_time, end_time, type, room_id) VALUES (?, ?, ?, ?, ?)',
      [currentDay, startTimeStr, endTimeStr, 'lecture', 1]
    );
    const studySessionId = sessionResult.insertId;
    console.log(`✅ Created study session ${studySessionId}`);
    
    // Link to CSCI235 subject
    await connection.execute(
      'INSERT INTO subject_study_session (subject_id, study_session_id) VALUES (?, ?)',
      [3, studySessionId] // CSCI235 subject_id = 3
    );
    console.log('✅ Linked to CSCI235 subject');
    
    // Link lecturer
    const lecturerId = 'QjZgQ0bUhFk3OEW9LyONty1eOU38vCcW';
    await connection.execute(
      'INSERT INTO lecturer_study_session (lecturer_id, study_session_id) VALUES (?, ?)',
      [lecturerId, studySessionId]
    );
    console.log('✅ Linked lecturer');
    
    // Enroll student
    const studentId = 'Lu7Q8RPLJQW6SzqWfMYvV45PGDXLg0gh';
    await connection.execute(
      'INSERT INTO student_study_session (student_id, study_session_id) VALUES (?, ?)',
      [studentId, studySessionId]
    );
    console.log('✅ Enrolled student sunard79@gmail.com');
    
    // Create QR code
    const [qrResult] = await connection.execute(
      'INSERT INTO qr_code (createdAt, valid_radius) VALUES (NOW(), 50.0)'
    );
    const qrCodeId = qrResult.insertId;
    console.log(`📱 Created QR code ${qrCodeId}`);
    
    // Create validity - active until lecture ends
    await connection.execute(
      'INSERT INTO validity (qr_code_id, start_time, end_time) VALUES (?, ?, ?)',
      [qrCodeId, startTime, endTime]
    );
    console.log(`✅ QR active until lecture ends at ${endTime.toLocaleTimeString()}`);
    
    // Link QR to study session
    await connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, studySessionId, 3] // Week 3 for this test
    );
    console.log('🔗 Linked QR to study session');
    
    console.log('\n🎉 5-MINUTE TEST LECTURE CREATED!');
    console.log('==================================');
    console.log(`📍 Study Session ID: ${studySessionId}`);
    console.log(`📱 QR Code ID: ${qrCodeId}`);
    console.log(`📚 Subject: CSCI235 Week 3`);
    console.log(`⏰ Lecture ends: ${endTime.toLocaleTimeString()}`);
    console.log(`📧 Email to: sunard79@gmail.com`);
    console.log('\n🔄 Email will be sent automatically when lecture expires!');
    console.log('💡 Or trigger manually with the API after 5 minutes');
    
    return studySessionId;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

create5MinTestLecture();