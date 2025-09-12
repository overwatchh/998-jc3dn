// Clean up old CSCI235 attendance records (fixed version)
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
    
    // Find CSCI235 subject
    const [csci235Subject] = await connection.execute(
      'SELECT * FROM subject WHERE code = ?',
      ['CSCI235']
    );
    
    if (csci235Subject.length === 0) {
      console.log('ℹ️  No CSCI235 subject found');
      return;
    }
    
    const subjectId = csci235Subject[0].id;
    console.log(`✅ Found CSCI235 subject (ID: ${subjectId}): ${csci235Subject[0].name}`);
    
    // Check users
    const [student] = await connection.execute(
      'SELECT * FROM user WHERE email = ?',
      ['sunard79@gmail.com']
    );
    
    const [lecturer] = await connection.execute(
      'SELECT * FROM user WHERE email = ?',
      ['dks695@uowmail.edu.au']
    );
    
    console.log(`✅ Student: ${student[0]?.name || 'Not found'} (${student[0]?.email || 'N/A'})`);
    console.log(`✅ Lecturer: ${lecturer[0]?.name || 'Not found'} (${lecturer[0]?.email || 'N/A'})`);
    
    // Find study sessions for CSCI235
    const [csci235Sessions] = await connection.execute(`
      SELECT DISTINCT ss.* 
      FROM study_session ss
      JOIN subject_study_session sss ON ss.id = sss.study_session_id
      WHERE sss.subject_id = ?
    `, [subjectId]);
    
    console.log(`\n🔍 Found ${csci235Sessions.length} CSCI235 study sessions`);
    
    if (csci235Sessions.length === 0) {
      console.log('ℹ️  No study sessions to clean up');
      return;
    }
    
    const sessionIds = csci235Sessions.map(s => s.id);
    console.log(`Session IDs to clean: ${sessionIds.join(', ')}`);
    
    // 1. Clean checkin records - use qr_code_study_session_id
    console.log('\n🧹 Cleaning attendance data...');
    console.log('1️⃣ Removing checkin records...');
    
    const [qrSessionIds] = await connection.execute(`
      SELECT id FROM qr_code_study_session WHERE study_session_id IN (${sessionIds.map(() => '?').join(',')})
    `, sessionIds);
    
    if (qrSessionIds.length > 0) {
      const qrIds = qrSessionIds.map(q => q.id);
      console.log(`   Found ${qrIds.length} QR session links to clean`);
      
      const [checkinResult] = await connection.execute(`
        DELETE FROM checkin WHERE qr_code_study_session_id IN (${qrIds.map(() => '?').join(',')})
      `, qrIds);
      console.log(`   Deleted ${checkinResult.affectedRows} checkin records`);
    }
    
    // 2. Clean student enrollments in CSCI235
    console.log('2️⃣ Removing student enrollments...');
    const [enrollmentResult] = await connection.execute(
      'DELETE FROM enrolment WHERE subject_id = ?',
      [subjectId]
    );
    console.log(`   Deleted ${enrollmentResult.affectedRows} enrollment records`);
    
    // 3. Clean student-study session links
    console.log('3️⃣ Removing student-study session links...');
    const [studentSessionResult] = await connection.execute(`
      DELETE FROM student_study_session WHERE study_session_id IN (${sessionIds.map(() => '?').join(',')})
    `, sessionIds);
    console.log(`   Deleted ${studentSessionResult.affectedRows} student-session links`);
    
    // 4. Clean QR code study session links
    console.log('4️⃣ Removing QR code study session links...');
    const [qrSessionResult] = await connection.execute(`
      DELETE FROM qr_code_study_session WHERE study_session_id IN (${sessionIds.map(() => '?').join(',')})
    `, sessionIds);
    console.log(`   Deleted ${qrSessionResult.affectedRows} QR-session links`);
    
    // 5. Clean validity records that are now orphaned
    console.log('5️⃣ Cleaning up orphaned validity records...');
    const [validityResult] = await connection.execute(`
      DELETE v FROM validity v
      LEFT JOIN qr_code_study_session qrss ON v.qr_code_id = qrss.qr_code_id
      WHERE qrss.qr_code_id IS NULL
    `);
    console.log(`   Deleted ${validityResult.affectedRows} orphaned validity records`);
    
    // 6. Clean attendance summary records
    console.log('6️⃣ Removing attendance summary records...');
    const [summaryResult] = await connection.execute(
      'DELETE FROM student_attendance_summary WHERE subject_id = ?',
      [subjectId]
    );
    console.log(`   Deleted ${summaryResult.affectedRows} attendance summary records`);
    
    // 7. Clean subject-study session links (but keep the study sessions themselves)
    console.log('7️⃣ Removing subject-study session links...');
    const [subjectSessionResult] = await connection.execute(
      'DELETE FROM subject_study_session WHERE subject_id = ?',
      [subjectId]
    );
    console.log(`   Deleted ${subjectSessionResult.affectedRows} subject-session links`);
    
    console.log('\n✅ CSCI235 cleanup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   ✅ Preserved users: sunard79@gmail.com, dks695@uowmail.edu.au`);
    console.log(`   ✅ Cleaned ${sessionIds.length} study sessions worth of data`);
    console.log(`   ✅ Removed all attendance records for CSCI235`);
    console.log(`   ✅ Subject CSCI235 still exists but has clean slate`);
    console.log(`   ✅ Study sessions still exist but not linked to CSCI235`);
    
    console.log('\n🎯 Ready for fresh testing with clean CSCI235 environment!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  } finally {
    await connection.end();
  }
}

cleanupCSCI235();