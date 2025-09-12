const mysql = require('mysql2/promise');

async function fixLecturerLink() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 Linking lecturer to the study session...');
    
    // Get the lecturer ID
    const [lecturerResult] = await connection.execute(
      'SELECT id FROM user WHERE email = ?',
      ['dks695@uowmail.edu.au']
    );
    
    if (lecturerResult.length === 0) {
      console.log('❌ Lecturer not found');
      return;
    }
    
    const lecturerId = lecturerResult[0].id;
    console.log(`👨‍🏫 Found lecturer: ${lecturerId}`);
    
    // Get the latest study session
    const [sessionResult] = await connection.execute(
      'SELECT id FROM study_session ORDER BY id DESC LIMIT 1'
    );
    
    if (sessionResult.length === 0) {
      console.log('❌ No study session found');
      return;
    }
    
    const studySessionId = sessionResult[0].id;
    console.log(`📚 Found study session: ${studySessionId}`);
    
    // Link lecturer to study session
    await connection.execute(
      'INSERT IGNORE INTO lecturer_study_session (lecturer_id, study_session_id) VALUES (?, ?)',
      [lecturerId, studySessionId]
    );
    console.log('✅ Linked lecturer to study session');
    
    // Check what the lecturer should see
    const [checkResult] = await connection.execute(`
      SELECT 
        s.name as subject_name,
        s.code as subject_code,
        ss.type,
        ss.start_time,
        ss.end_time,
        qr.id as qr_code_id,
        v.start_time as qr_start,
        v.end_time as qr_end
      FROM study_session ss
      JOIN lecturer_study_session lss ON lss.study_session_id = ss.id
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      LEFT JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
      LEFT JOIN qr_code qr ON qr.id = qrss.qr_code_id
      LEFT JOIN validity v ON v.qr_code_id = qr.id
      WHERE lss.lecturer_id = ?
      ORDER BY ss.start_time DESC
    `, [lecturerId]);
    
    console.log('\n📋 What lecturer should see:');
    console.log(checkResult);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixLecturerLink();