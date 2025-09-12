// Fix student enrollment with correct column structure
const mysql = require('mysql2/promise');

async function fixEnrollmentSimple() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    const studentId = 'Lu7Q8RPLJQW6SzqWfMYvV45PGDXLg0gh'; // sunard79@gmail.com
    const subjectId = 3; // CSCI235
    const studySessionId = 18;
    
    console.log('🔧 Fixing student enrollment with correct structure...');
    
    // Enroll student in CSCI235 with only the columns that exist
    console.log('👨‍🎓 Enrolling student...');
    await connection.execute(
      'INSERT IGNORE INTO enrolment (student_id, subject_id, date) VALUES (?, ?, NOW())',
      [studentId, subjectId]
    );
    console.log('✅ Student enrolled in CSCI235');
    
    // Create student-session link with only existing columns
    console.log('🔗 Creating student-session link...');
    await connection.execute(
      'INSERT IGNORE INTO student_study_session (student_id, study_session_id) VALUES (?, ?)',
      [studentId, studySessionId]
    );
    console.log('✅ Student-session link created');
    
    // Verify the setup
    console.log('\n🔍 Final verification...');
    
    const [enrollment] = await connection.execute(
      'SELECT * FROM enrolment WHERE student_id = ? AND subject_id = ?',
      [studentId, subjectId]
    );
    
    const [sessionLink] = await connection.execute(
      'SELECT * FROM student_study_session WHERE student_id = ? AND study_session_id = ?',
      [studentId, studySessionId]
    );
    
    console.log(`✅ Enrollment: ${enrollment.length > 0 ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Session Link: ${sessionLink.length > 0 ? 'SUCCESS' : 'FAILED'}`);
    
    // Show current lecture status
    console.log('\n📅 Current lecture status:');
    const [lectureStatus] = await connection.execute(`
      SELECT 
        v.end_time,
        CASE 
          WHEN v.end_time < NOW() THEN 'EXPIRED'
          ELSE 'ACTIVE'
        END as status,
        TIMESTAMPDIFF(MINUTE, NOW(), v.end_time) as minutes_remaining
      FROM validity v
      JOIN qr_code_study_session qrss ON v.qr_code_id = qrss.qr_code_id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      WHERE sss.subject_id = ?
      ORDER BY v.end_time DESC
      LIMIT 1
    `, [subjectId]);
    
    if (lectureStatus.length > 0) {
      const lecture = lectureStatus[0];
      console.log(`   End Time: ${new Date(lecture.end_time).toLocaleTimeString()}`);
      console.log(`   Status: ${lecture.status}`);
      if (lecture.status === 'ACTIVE') {
        console.log(`   Minutes Remaining: ${lecture.minutes_remaining}`);
      } else {
        console.log(`   Minutes Since Expired: ${Math.abs(lecture.minutes_remaining)}`);
      }
    }
    
    console.log('\n🎯 All enrollment fixes completed successfully!');
    console.log('📧 System is ready for automatic email reminders when lecture expires');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixEnrollmentSimple();