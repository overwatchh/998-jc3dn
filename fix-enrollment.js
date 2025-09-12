// Fix student enrollment and check table structures
const mysql = require('mysql2/promise');

async function fixEnrollment() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 Fixing student enrollment and session links...');
    
    // Check enrolment table structure
    console.log('\n📋 Checking enrolment table structure...');
    const [enrolmentCols] = await connection.execute('DESCRIBE enrolment');
    console.log('Enrolment columns:');
    enrolmentCols.forEach(col => console.log(`  - ${col.Field}`));
    
    // Check student_study_session table structure
    console.log('\n📋 Checking student_study_session table structure...');
    const [studentSessionCols] = await connection.execute('DESCRIBE student_study_session');
    console.log('Student_study_session columns:');
    studentSessionCols.forEach(col => console.log(`  - ${col.Field}`));
    
    const studentId = 'Lu7Q8RPLJQW6SzqWfMYvV45PGDXLg0gh'; // sunard79@gmail.com
    const subjectId = 3; // CSCI235
    const studySessionId = 18;
    
    // Fix enrollment - check what columns actually exist
    console.log('\n👨‍🎓 Fixing student enrollment...');
    const enrolmentColumns = enrolmentCols.map(col => col.Field);
    
    let enrollmentQuery;
    let enrollmentParams;
    
    if (enrolmentColumns.includes('semester_id')) {
      enrollmentQuery = 'INSERT IGNORE INTO enrolment (student_id, subject_id, semester_id, status) VALUES (?, ?, ?, ?)';
      enrollmentParams = [studentId, subjectId, 1, 'active'];
    } else {
      enrollmentQuery = 'INSERT IGNORE INTO enrolment (student_id, subject_id, status) VALUES (?, ?, ?)';
      enrollmentParams = [studentId, subjectId, 'active'];
    }
    
    await connection.execute(enrollmentQuery, enrollmentParams);
    console.log('✅ Fixed student enrollment');
    
    // Fix student-study session link
    console.log('\n🔗 Fixing student-study session link...');
    const sessionColumns = studentSessionCols.map(col => col.Field);
    
    let sessionQuery;
    let sessionParams;
    
    if (sessionColumns.includes('enrolled')) {
      sessionQuery = 'INSERT IGNORE INTO student_study_session (student_id, study_session_id, enrolled) VALUES (?, ?, ?)';
      sessionParams = [studentId, studySessionId, 1];
    } else {
      sessionQuery = 'INSERT IGNORE INTO student_study_session (student_id, study_session_id) VALUES (?, ?)';
      sessionParams = [studentId, studySessionId];
    }
    
    await connection.execute(sessionQuery, sessionParams);
    console.log('✅ Fixed student-session link');
    
    // Verify enrollment
    console.log('\n🔍 Verifying enrollment...');
    const [enrollment] = await connection.execute(
      'SELECT * FROM enrolment WHERE student_id = ? AND subject_id = ?',
      [studentId, subjectId]
    );
    
    if (enrollment.length > 0) {
      console.log('✅ Student successfully enrolled in CSCI235');
    } else {
      console.log('❌ Student enrollment failed');
    }
    
    // Verify student-session link
    const [sessionLink] = await connection.execute(
      'SELECT * FROM student_study_session WHERE student_id = ? AND study_session_id = ?',
      [studentId, studySessionId]
    );
    
    if (sessionLink.length > 0) {
      console.log('✅ Student-session link created successfully');
    } else {
      console.log('❌ Student-session link failed');
    }
    
    console.log('\n🎯 Enrollment fixes completed!');
    
  } catch (error) {
    console.error('❌ Error fixing enrollment:', error.message);
  } finally {
    await connection.end();
  }
}

fixEnrollment();