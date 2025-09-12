const mysql = require('mysql2/promise');

async function addLectureNoQR() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('📚 Creating CSCI235 lecture (WITHOUT auto QR code)...');
    
    // Clear previous data first
    await connection.execute('DELETE FROM lecturer_study_session');
    await connection.execute('DELETE FROM student_study_session'); 
    await connection.execute('DELETE FROM subject_study_session');
    await connection.execute('DELETE FROM qr_code_study_session');
    await connection.execute('DELETE FROM validity');
    await connection.execute('DELETE FROM qr_code');
    await connection.execute('DELETE FROM study_session');
    
    const now = new Date();
    const startTime = new Date(now.getTime() - 5 * 60 * 1000); // Started 5 min ago
    const endTime = new Date(now.getTime() + 25 * 60 * 1000);  // Ends in 25 min
    
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    console.log(`📅 Lecture: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    
    // 1. Create study session ONLY
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
    
    // 3. Link lecturer to study session
    const lecturerId = 'QjZgQ0bUhFk3OEW9LyONty1eOU38vCcW';
    await connection.execute(
      'INSERT INTO lecturer_study_session (lecturer_id, study_session_id) VALUES (?, ?)',
      [lecturerId, studySessionId]
    );
    console.log('✅ Linked lecturer to study session');
    
    console.log('\n🎉 CSCI235 LECTURE READY!');
    console.log('=========================');
    console.log(`📍 Subject: CSCI235 Database Systems`);
    console.log(`⏰ Running until: ${endTime.toLocaleTimeString()}`);
    console.log('🔘 NO QR code yet - you need to click "Generate QR Code" button!');
    console.log('🔄 Refresh your QR generation page to see the lecture');
    
  } catch (error) {
    console.error('❌ Error creating lecture:', error.message);
  } finally {
    await connection.end();
  }
}

addLectureNoQR();