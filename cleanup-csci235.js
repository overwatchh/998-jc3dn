// Clean up old CSCI235 attendance records while preserving specific users
const mysql = require('mysql2/promise');

async function cleanupCSCI235() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🧹 Starting cleanup of CSCI235 attendance records...');
    
    // First, let's find the CSCI235 subject
    const [csci235Subject] = await connection.execute(
      'SELECT * FROM subject WHERE code = ?',
      ['CSCI235']
    );
    
    if (csci235Subject.length === 0) {
      console.log('ℹ️  No CSCI235 subject found, checking for similar subjects...');
      const [allSubjects] = await connection.execute('SELECT * FROM subject');
      console.log('Available subjects:');
      allSubjects.forEach(subject => {
        console.log(`  - ${subject.code}: ${subject.name} (ID: ${subject.id})`);
      });
      return;
    }
    
    const subjectId = csci235Subject[0].id;
    console.log(`✅ Found CSCI235 subject (ID: ${subjectId}): ${csci235Subject[0].name}`);
    
    // Check what users we need to preserve
    console.log('\n🔍 Checking specified users...');
    
    const [student] = await connection.execute(
      'SELECT * FROM user WHERE email = ?',
      ['sunard79@gmail.com']
    );
    
    const [lecturer] = await connection.execute(
      'SELECT * FROM user WHERE email = ?',
      ['dks695@uowmail.edu.au']
    );
    
    if (student.length > 0) {
      console.log(`✅ Found student: ${student[0].name} (${student[0].email}) - ID: ${student[0].id}`);
    } else {
      console.log('⚠️  Student sunard79@gmail.com not found');
    }
    
    if (lecturer.length > 0) {
      console.log(`✅ Found lecturer: ${lecturer[0].name} (${lecturer[0].email}) - ID: ${lecturer[0].id}`);
    } else {
      console.log('⚠️  Lecturer dks695@uowmail.edu.au not found');
    }
    
    // Find study sessions related to CSCI235
    console.log('\n🔍 Finding CSCI235 study sessions...');
    const [csci235Sessions] = await connection.execute(`
      SELECT DISTINCT ss.* 
      FROM study_session ss
      JOIN subject_study_session sss ON ss.id = sss.study_session_id
      WHERE sss.subject_id = ?
    `, [subjectId]);
    
    console.log(`Found ${csci235Sessions.length} CSCI235 study sessions`);
    csci235Sessions.forEach(session => {
      console.log(`  - Session ${session.id}: ${session.type} (${session.start_time} - ${session.end_time})`);
    });
    
    if (csci235Sessions.length === 0) {
      console.log('ℹ️  No study sessions found for CSCI235');
      return;
    }
    
    const sessionIds = csci235Sessions.map(s => s.id);
    
    // Now clean up attendance records for CSCI235
    console.log('\n🧹 Cleaning up CSCI235 attendance data...');
    
    // 1. Clean checkin records for CSCI235 sessions
    console.log('1️⃣ Removing checkin records...');
    const [checkinResult] = await connection.execute(`
      DELETE c FROM checkin c
      JOIN session s ON c.session_id = s.id
      WHERE s.study_session_id IN (${sessionIds.map(() => '?').join(',')})
    `, sessionIds);
    console.log(`   Deleted ${checkinResult.affectedRows} checkin records`);
    
    // 2. Clean session records for CSCI235
    console.log('2️⃣ Removing QR session records...');
    const [sessionResult] = await connection.execute(`
      DELETE FROM session WHERE study_session_id IN (${sessionIds.map(() => '?').join(',')})
    `, sessionIds);
    console.log(`   Deleted ${sessionResult.affectedRows} session records`);
    
    // 3. Clean student enrollment in CSCI235 (but keep the users)
    console.log('3️⃣ Removing student enrollments in CSCI235...');
    const [enrollmentResult] = await connection.execute(
      'DELETE FROM enrolment WHERE subject_id = ?',
      [subjectId]
    );
    console.log(`   Deleted ${enrollmentResult.affectedRows} enrollment records`);
    
    // 4. Clean student-study session links
    console.log('4️⃣ Removing student-study session links...');
    const [studentSessionResult] = await connection.execute(`
      DELETE FROM student_study_session WHERE study_session_id IN (${sessionIds.map(() => '?').join(',')})
    `, sessionIds);
    console.log(`   Deleted ${studentSessionResult.affectedRows} student-session links`);
    
    // 5. Clean QR code links to study sessions
    console.log('5️⃣ Removing QR code study session links...');
    const [qrSessionResult] = await connection.execute(`
      DELETE FROM qr_code_study_session WHERE study_session_id IN (${sessionIds.map(() => '?').join(',')})
    `, sessionIds);
    console.log(`   Deleted ${qrSessionResult.affectedRows} QR-session links`);
    
    // 6. Clean validity records (only if not used by other subjects)
    console.log('6️⃣ Cleaning up orphaned validity records...');
    const [validityResult] = await connection.execute(`
      DELETE v FROM validity v
      LEFT JOIN qr_code_study_session qrss ON v.qr_code_id = qrss.qr_code_id
      WHERE qrss.qr_code_id IS NULL
    `);
    console.log(`   Deleted ${validityResult.affectedRows} orphaned validity records`);
    
    // 7. Clean attendance summary records
    console.log('7️⃣ Removing attendance summary records...');
    const [summaryResult] = await connection.execute(
      'DELETE FROM student_attendance_summary WHERE subject_id = ?',
      [subjectId]
    );
    console.log(`   Deleted ${summaryResult.affectedRows} attendance summary records`);
    
    console.log('\n✅ CSCI235 cleanup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Preserved users: sunard79@gmail.com, dks695@uowmail.edu.au`);
    console.log(`   - Cleaned ${csci235Sessions.length} study sessions worth of data`);
    console.log(`   - Removed all attendance records for CSCI235`);
    console.log(`   - Subject CSCI235 still exists but has no attendance data`);
    
    console.log('\n🎯 Ready for fresh testing with clean CSCI235 environment!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  } finally {
    await connection.end();
  }
}

cleanupCSCI235();