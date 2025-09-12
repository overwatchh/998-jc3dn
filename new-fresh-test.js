// New fresh automatic test - complete cleanup and setup
const mysql = require('mysql2/promise');

async function newFreshTest() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🎯 NEW FRESH AUTOMATIC TEST SETUP');
    console.log('==================================');
    console.log('🤖 100% AUTOMATIC - No manual triggers!');
    
    const subjectId = 3; // CSCI235
    const studySessionId = 18; // CSCI235 study session
    
    console.log('\n1️⃣ COMPLETE DATA CLEANUP');
    
    // Clean email logs first
    console.log('   🗑️  Cleaning email logs...');
    await connection.execute('DELETE FROM email_log WHERE 1=1');
    console.log('       ✅ All email logs cleared');
    
    // Remove ALL check-ins for CSCI235
    console.log('   🗑️  Removing ALL check-ins...');
    const [checkinResult] = await connection.execute(`
      DELETE c FROM checkin c
      JOIN qr_code_study_session qrss ON c.qr_code_study_session_id = qrss.id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      WHERE sss.subject_id = ?
    `, [subjectId]);
    console.log(`       ✅ Deleted ${checkinResult.affectedRows} checkin records`);
    
    // Remove ALL QR-study session links for CSCI235
    console.log('   🗑️  Removing ALL QR-study session links...');
    const [qrSessionResult] = await connection.execute(`
      DELETE qrss FROM qr_code_study_session qrss
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      WHERE sss.subject_id = ?
    `, [subjectId]);
    console.log(`       ✅ Deleted ${qrSessionResult.affectedRows} QR-session links`);
    
    // Remove ALL orphaned validity records
    console.log('   🗑️  Removing ALL orphaned validity records...');
    const [validityResult] = await connection.execute(`
      DELETE v FROM validity v
      LEFT JOIN qr_code_study_session qrss ON v.qr_code_id = qrss.qr_code_id
      WHERE qrss.qr_code_id IS NULL
    `);
    console.log(`       ✅ Deleted ${validityResult.affectedRows} orphaned validity records`);
    
    // Remove ALL orphaned QR codes
    console.log('   🗑️  Removing ALL orphaned QR codes...');
    const [qrResult] = await connection.execute(`
      DELETE qr FROM qr_code qr
      LEFT JOIN qr_code_study_session qrss ON qr.id = qrss.qr_code_id
      WHERE qrss.qr_code_id IS NULL
    `);
    console.log(`       ✅ Deleted ${qrResult.affectedRows} orphaned QR codes`);
    
    // Clean attendance summaries
    console.log('   🗑️  Removing attendance summaries...');
    const [summaryResult] = await connection.execute(
      'DELETE FROM student_attendance_summary WHERE subject_id = ?',
      [subjectId]
    );
    console.log(`       ✅ Deleted ${summaryResult.affectedRows} summary records`);
    
    console.log('✅ COMPLETE CLEANUP FINISHED!');
    
    // Step 2: Setup fresh automatic test
    console.log('\n2️⃣ SETTING UP NEW AUTOMATIC TEST');
    
    const now = new Date();
    const startTime = new Date(now);
    startTime.setMinutes(startTime.getMinutes() - 20); // Started 20 minutes ago
    
    const endTime = new Date(now);
    endTime.setMinutes(endTime.getMinutes() + 7); // Will expire in 7 minutes
    
    const minutesUntilExpiry = Math.ceil((endTime - now) / (1000 * 60));
    
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    console.log(`📅 Lecture timing: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    console.log(`🎯 Will expire in ${minutesUntilExpiry} minutes at: ${endTime.toLocaleTimeString()}`);
    
    // Create brand new QR code
    const [newQrResult] = await connection.execute(
      'INSERT INTO qr_code (createdAt, valid_radius) VALUES (NOW(), 50.0)'
    );
    const qrCodeId = newQrResult.insertId;
    console.log(`📱 Created new QR code (ID: ${qrCodeId})`);
    
    // Create validity record
    await connection.execute(
      'INSERT INTO validity (qr_code_id, start_time, end_time) VALUES (?, ?, ?)',
      [qrCodeId, startTime, endTime]
    );
    console.log(`✅ Created validity record with ${minutesUntilExpiry}-minute expiry`);
    
    // Link to CSCI235 study session - use Week 7 for this fresh test
    const weekNumber = 7;
    
    await connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, studySessionId, weekNumber]
    );
    console.log(`🔗 Linked to CSCI235 Session ${studySessionId}, Week ${weekNumber}`);
    
    // Verify student enrollment
    console.log('\n3️⃣ VERIFYING STUDENT ENROLLMENT');
    const [enrollment] = await connection.execute(`
      SELECT u.name, u.email 
      FROM enrolment e
      JOIN user u ON u.id = e.student_id
      JOIN subject s ON s.id = e.subject_id
      WHERE s.code = 'CSCI235'
    `);
    
    if (enrollment.length === 0) {
      const studentId = 'Lu7Q8RPLJQW6SzqWfMYvV45PGDXLg0gh'; // sunard79@gmail.com
      await connection.execute(
        'INSERT INTO enrolment (student_id, subject_id, date) VALUES (?, ?, NOW())',
        [studentId, subjectId]
      );
      console.log('   ✅ Re-enrolled sunard79@gmail.com in CSCI235');
    } else {
      console.log('   ✅ Student already enrolled:');
      enrollment.forEach(student => {
        console.log(`      📧 ${student.name} (${student.email})`);
      });
    }
    
    // Show automatic timeline
    const schedulerCheckTime1 = new Date(endTime.getTime() + 5*60*1000); // 5 minutes after expiry
    const schedulerCheckTime2 = new Date(endTime.getTime() + 10*60*1000); // 10 minutes after expiry
    const expectedEmailTime = new Date(endTime.getTime() + 7*60*1000); // ~7 minutes after expiry
    
    console.log('\n4️⃣ AUTOMATIC TIMELINE PREDICTION');
    console.log(`📅 Lecture expires at: ${endTime.toLocaleTimeString()}`);
    console.log(`🤖 First scheduler check: ~${schedulerCheckTime1.toLocaleTimeString()}`);
    console.log(`🤖 Second scheduler check: ~${schedulerCheckTime2.toLocaleTimeString()}`);
    console.log(`📧 Expected email arrival: ~${expectedEmailTime.toLocaleTimeString()}`);
    
    // Verify scheduler can find this session once it expires
    console.log('\n5️⃣ VERIFICATION - NEW TEST READY');
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
      console.log(`✅ New test session verified: ${session.subject_code} Week ${session.week_number}`);
      console.log(`   QR Code: ${session.qr_code_id}`);
      console.log(`   Expires: ${new Date(session.end_time).toLocaleTimeString()}`);
      console.log(`   Minutes until expiry: ${session.minutes_until_expiry}`);
    }
    
    console.log('\n🎯 NEW FRESH AUTOMATIC TEST READY!');
    console.log('===================================');
    console.log(`⏰ Lecture expires at: ${endTime.toLocaleTimeString()}`);
    console.log(`📧 Email will be sent to: sunard79@gmail.com`);
    console.log(`🤖 Scheduler runs every 5 minutes - will detect automatically`);
    console.log(`🚫 NO MANUAL INTERVENTION - Pure automatic system test`);
    console.log(`🔥 Check your email around: ${expectedEmailTime.toLocaleTimeString()}`);
    console.log(`🧹 COMPLETELY FRESH - No previous data interference!`);
    
  } catch (error) {
    console.error('❌ Error in new fresh test setup:', error.message);
  } finally {
    await connection.end();
  }
}

newFreshTest();