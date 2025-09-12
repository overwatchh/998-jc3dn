const mysql = require('mysql2/promise');

async function fixStudentEnrollment() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('👥 Fixing student enrollment for session 22...');
    
    // Check if student exists
    const [studentResult] = await connection.execute(
      "SELECT id, email FROM user WHERE email = 'sunard79@gmail.com'"
    );
    
    if (studentResult.length === 0) {
      console.log('❌ Student sunard79@gmail.com not found in database');
      return;
    }
    
    const studentId = studentResult[0].id;
    console.log(`✅ Student found: ${studentId} (${studentResult[0].email})`);
    
    // Get the subject ID for session 22
    const [subjectResult] = await connection.execute(`
      SELECT s.id as subject_id, s.code, s.name
      FROM subject s
      JOIN subject_study_session sss ON sss.subject_id = s.id
      WHERE sss.study_session_id = 22
    `);
    
    if (subjectResult.length === 0) {
      console.log('❌ No subject found for session 22');
      return;
    }
    
    const subjectId = subjectResult[0].subject_id;
    console.log(`✅ Subject found: ${subjectId} (${subjectResult[0].code} - ${subjectResult[0].name})`);
    
    // Check if student is already enrolled
    const [enrollmentCheck] = await connection.execute(
      'SELECT * FROM student_study_session WHERE student_id = ? AND subject_id = ?',
      [studentId, subjectId]
    );
    
    if (enrollmentCheck.length > 0) {
      console.log('✅ Student already enrolled in the subject');
    } else {
      // Enroll the student
      await connection.execute(
        'INSERT INTO student_study_session (student_id, subject_id) VALUES (?, ?)',
        [studentId, subjectId]
      );
      console.log('✅ Student enrolled in the subject');
    }
    
    // Verify enrollment
    const [verifyResult] = await connection.execute(`
      SELECT 
        u.email,
        s.code,
        s.name
      FROM user u
      JOIN student_study_session sss ON sss.student_id = u.id
      JOIN subject s ON s.id = sss.subject_id
      JOIN subject_study_session subss ON subss.subject_id = s.id
      WHERE subss.study_session_id = 22 AND u.email = 'sunard79@gmail.com'
    `);
    
    if (verifyResult.length > 0) {
      console.log(`✅ Enrollment verified: ${verifyResult[0].email} → ${verifyResult[0].code} → Session 22`);
    } else {
      console.log('❌ Enrollment verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixStudentEnrollment();