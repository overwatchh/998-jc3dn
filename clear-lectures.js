const mysql = require('mysql2/promise');

async function clearLectures() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🧹 CLEARING ALL LECTURES...');
    
    // Delete all checkins
    const [checkinResult] = await connection.execute('DELETE FROM checkin');
    console.log(`✅ Deleted ${checkinResult.affectedRows} checkins`);
    
    // Delete all qr_code_study_session links
    const [qrSessionResult] = await connection.execute('DELETE FROM qr_code_study_session');
    console.log(`✅ Deleted ${qrSessionResult.affectedRows} QR-session links`);
    
    // Delete all validity records
    const [validityResult] = await connection.execute('DELETE FROM validity');
    console.log(`✅ Deleted ${validityResult.affectedRows} validity records`);
    
    // Delete all QR codes
    const [qrResult] = await connection.execute('DELETE FROM qr_code');
    console.log(`✅ Deleted ${qrResult.affectedRows} QR codes`);
    
    // Delete lecturer-study session links first (foreign key constraint)
    const [lecturerSessionResult] = await connection.execute('DELETE FROM lecturer_study_session');
    console.log(`✅ Deleted ${lecturerSessionResult.affectedRows} lecturer-session links`);
    
    // Delete student-study session links
    const [studentSessionResult] = await connection.execute('DELETE FROM student_study_session');
    console.log(`✅ Deleted ${studentSessionResult.affectedRows} student-session links`);
    
    // Delete all subject-study session links
    const [subjectSessionResult] = await connection.execute('DELETE FROM subject_study_session');
    console.log(`✅ Deleted ${subjectSessionResult.affectedRows} subject-session links`);
    
    // Delete all study sessions
    const [sessionResult] = await connection.execute('DELETE FROM study_session');
    console.log(`✅ Deleted ${sessionResult.affectedRows} study sessions`);
    
    console.log('\n🎉 ALL LECTURES CLEARED!');
    console.log('Your QR generation page should now be empty.');
    
  } catch (error) {
    console.error('❌ Error clearing lectures:', error.message);
  } finally {
    await connection.end();
  }
}

clearLectures();