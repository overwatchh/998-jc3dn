// Clean previous data and setup fresh 5-minute test
const mysql = require('mysql2/promise');

async function cleanAndSetup5Min() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🧹 CLEANING PREVIOUS LECTURE DATA AND SETTING UP 5-MINUTE TEST');
    console.log('==============================================================');
    
    // Step 1: Clean up all previous CSCI235 attendance data
    console.log('\n1️⃣ Cleaning previous CSCI235 lecture data...');
    
    const subjectId = 3; // CSCI235
    
    // Remove all check-ins for CSCI235 sessions
    console.log('   Removing check-ins...');
    const [checkinResult] = await connection.execute(`
      DELETE c FROM checkin c
      JOIN qr_code_study_session qrss ON c.qr_code_study_session_id = qrss.id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      WHERE sss.subject_id = ?
    `, [subjectId]);
    console.log(`   Deleted ${checkinResult.affectedRows} checkin records`);
    
    // Remove QR-study session links for CSCI235
    console.log('   Removing QR-study session links...');
    const [qrSessionResult] = await connection.execute(`
      DELETE qrss FROM qr_code_study_session qrss
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      WHERE sss.subject_id = ?
    `, [subjectId]);
    console.log(`   Deleted ${qrSessionResult.affectedRows} QR-session links`);
    
    // Remove orphaned validity records
    console.log('   Removing orphaned validity records...');
    const [validityResult] = await connection.execute(`
      DELETE v FROM validity v
      LEFT JOIN qr_code_study_session qrss ON v.qr_code_id = qrss.qr_code_id
      WHERE qrss.qr_code_id IS NULL
    `);
    console.log(`   Deleted ${validityResult.affectedRows} orphaned validity records`);
    
    // Remove email logs for CSCI235 (check if table exists first)
    console.log('   Cleaning email logs...');
    try {
      const [emailResult] = await connection.execute(`
        DELETE FROM email_log 
        WHERE study_session_id IN (
          SELECT study_session_id FROM subject_study_session WHERE subject_id = ?
        )
      `, [subjectId]);
      console.log(`   Deleted ${emailResult.affectedRows} email log records`);
    } catch (e) {
      console.log('   Email log table may not exist yet');
    }
    
    console.log('✅ Previous data cleaned successfully!');
    
    // Step 2: Set up fresh test with current time + 5 minutes
    console.log('\n2️⃣ Setting up fresh 5-minute automatic test...');
    
    const now = new Date();
    const startTime = new Date(now);
    startTime.setMinutes(startTime.getMinutes() - 10); // Started 10 minutes ago
    
    const endTime = new Date(now);
    endTime.setMinutes(endTime.getMinutes() + 5); // Will expire in 5 minutes
    
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    console.log(`📅 Lecture timing: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    console.log(`🎯 Will expire in exactly 5 minutes at: ${endTime.toLocaleTimeString()}`);
    
    // Create new QR code
    const [qrResult] = await connection.execute(
      'INSERT INTO qr_code (createdAt, valid_radius) VALUES (NOW(), 50.0)'
    );
    const qrCodeId = qrResult.insertId;
    console.log(`📱 Created new QR code (ID: ${qrCodeId})`);
    
    // Create validity record
    await connection.execute(
      'INSERT INTO validity (qr_code_id, start_time, end_time) VALUES (?, ?, ?)',
      [qrCodeId, startTime, endTime]
    );
    console.log(`✅ Created validity record with 5-minute expiry`);
    
    // Link to CSCI235 study session (Week 4 for this test)
    const studySessionId = 18; // CSCI235 session
    const weekNumber = 4; // Fresh week for this test
    
    await connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, studySessionId, weekNumber]
    );
    console.log(`🔗 Linked to CSCI235 Session ${studySessionId}, Week ${weekNumber}`);
    
    // Verify student enrollment (should still exist from before)
    const [enrollment] = await connection.execute(`
      SELECT u.name, u.email 
      FROM enrolment e
      JOIN user u ON u.id = e.student_id
      JOIN subject s ON s.id = e.subject_id
      WHERE s.code = 'CSCI235'
    `);
    
    console.log('\n👥 Students enrolled (will receive automatic email):');
    if (enrollment.length > 0) {
      enrollment.forEach(student => {
        console.log(`   📧 ${student.name} (${student.email})`);
      });
    } else {
      console.log('   ❌ No students enrolled - need to re-enroll!');
      
      // Re-enroll student
      const studentId = 'Lu7Q8RPLJQW6SzqWfMYvV45PGDXLg0gh'; // sunard79@gmail.com
      await connection.execute(
        'INSERT IGNORE INTO enrolment (student_id, subject_id, date) VALUES (?, ?, NOW())',
        [studentId, subjectId]
      );
      console.log('   ✅ Re-enrolled sunard79@gmail.com');
    }
    
    // Test scheduler query to confirm it will be detected
    console.log('\n3️⃣ Verifying scheduler will detect this session...');
    const [testQuery] = await connection.execute(`
      SELECT DISTINCT
        qrss.study_session_id,
        qrss.week_number,
        qrss.qr_code_id,
        v.end_time,
        s.code as subject_code,
        TIMESTAMPDIFF(MINUTE, NOW(), v.end_time) as minutes_until_expiry
      FROM qr_code_study_session qrss
      JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235' AND qrss.week_number = ?
      ORDER BY v.end_time DESC
      LIMIT 1
    `, [weekNumber]);
    
    if (testQuery.length > 0) {
      const session = testQuery[0];
      console.log(`✅ Test session ready: ${session.subject_code} Week ${session.week_number}`);
      console.log(`   QR Code: ${session.qr_code_id}`);
      console.log(`   Expires: ${new Date(session.end_time).toLocaleTimeString()}`);
      console.log(`   Minutes until expiry: ${session.minutes_until_expiry}`);
    }
    
    console.log('\n🎯 FRESH 5-MINUTE AUTOMATIC TEST SETUP COMPLETE!');
    console.log('================================================');
    console.log(`⏰ Lecture will expire at: ${endTime.toLocaleTimeString()}`);
    console.log(`📧 Automatic email will be sent to: sunard79@gmail.com`);
    console.log(`🤖 Scheduler will detect within 5 minutes after expiry`);
    console.log(`🔥 Check your email around: ${new Date(endTime.getTime() + 5*60*1000).toLocaleTimeString()}`);
    
  } catch (error) {
    console.error('❌ Error in cleanup and setup:', error.message);
  } finally {
    await connection.end();
  }
}

cleanAndSetup5Min();