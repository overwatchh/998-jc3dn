// Final system cleanup and single server restart
const mysql = require('mysql2/promise');

async function cleanSystemRestart() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 FINAL SYSTEM CLEANUP AND RESTART');
    console.log('===================================');
    
    // Complete data cleanup
    console.log('1️⃣ CLEARING ALL DATA...');
    await connection.execute('DELETE FROM email_log WHERE 1=1');
    await connection.execute('DELETE FROM checkin WHERE 1=1');
    await connection.execute('DELETE FROM qr_code_study_session WHERE 1=1');
    await connection.execute('DELETE FROM validity WHERE 1=1');
    await connection.execute('DELETE FROM qr_code WHERE 1=1');
    await connection.execute('DELETE FROM student_attendance_summary WHERE 1=1');
    console.log('   ✅ All old data cleared');
    
    // Re-enroll student
    const studentId = 'Lu7Q8RPLJQW6SzqWfMYvV45PGDXLg0gh';
    await connection.execute(
      'INSERT IGNORE INTO enrolment (student_id, subject_id, date) VALUES (?, ?, NOW())',
      [studentId, 3]
    );
    console.log('   ✅ Student re-enrolled');
    
    // Create a lecture that expires in 3 minutes
    const now = new Date();
    const startTime = new Date(now.getTime() - 10*60*1000); // Started 10 min ago
    const endTime = new Date(now.getTime() + 3*60*1000); // Expires in 3 minutes
    
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    console.log(`📅 Lecture expires: ${endTime.toLocaleTimeString()}`);
    
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
    
    // Link to CSCI235 Week 13 (fresh week)
    await connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, 18, 13]
    );
    
    console.log(`📱 QR Code: ${qrCodeId}`);
    console.log(`📅 Week: 13`);
    console.log(`🎯 Expires at: ${endTime.toLocaleTimeString()}`);
    
    console.log('\n✅ SYSTEM READY FOR CLEAN TEST!');
    console.log('===============================');
    console.log('🔄 Kill all Node servers and restart only ONE');
    console.log('📧 Fresh email with correct percentages (100%/50%/0%)');
    console.log('🚫 No old data interference');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

cleanSystemRestart();