// Fresh automatic email test - NO manual triggers, let scheduler work naturally
const mysql = require('mysql2/promise');

async function setupFreshAutomaticTest() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🧹 FRESH AUTOMATIC EMAIL TEST SETUP');
    console.log('===================================');
    console.log('🤖 NO MANUAL TRIGGERS - Let the 5-minute scheduler work naturally!');
    
    const subjectId = 3; // CSCI235
    const studySessionId = 18; // CSCI235 study session
    
    console.log('\n1️⃣ COMPLETE CLEANUP - REMOVING ALL PREVIOUS CSCI235 DATA');
    
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
    
    // Clean email logs
    console.log('   🗑️  Cleaning email logs...');
    try {
      const [emailResult] = await connection.execute(`
        DELETE FROM email_log 
        WHERE study_session_id = ?
      `, [studySessionId]);
      console.log(`       ✅ Deleted ${emailResult.affectedRows} email log records`);
    } catch (e) {
      console.log('       ℹ️  Email log table may not exist');
    }
    
    console.log('✅ COMPLETE CLEANUP FINISHED!');
    
    // Step 2: Setup fresh lecture for automatic detection
    console.log('\n2️⃣ SETTING UP FRESH LECTURE FOR AUTOMATIC SCHEDULER TEST');
    
    const now = new Date();
    const startTime = new Date(now);
    startTime.setMinutes(startTime.getMinutes() - 15); // Started 15 minutes ago
    
    const endTime = new Date(now);
    endTime.setMinutes(endTime.getMinutes() + 8); // Will expire in 8 minutes
    
    const minutesUntilExpiry = Math.ceil((endTime - now) / (1000 * 60));
    
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    console.log(`📅 New lecture timing: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    console.log(`🎯 Will expire in ${minutesUntilExpiry} minutes at: ${endTime.toLocaleTimeString()}`);
    console.log(`🤖 Automatic scheduler runs every 5 minutes - will detect after expiry`);
    
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
    
    // Link to CSCI235 study session
    const weekNumber = 6; // Fresh week for this test
    
    await connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, studySessionId, weekNumber]
    );
    console.log(`🔗 Linked to CSCI235 Session ${studySessionId}, Week ${weekNumber}`);
    
    // Verify student enrollment
    console.log('\n3️⃣ ENSURING STUDENT ENROLLMENT');
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
    
    // Show the expected automatic timeline
    const schedulerCheckTime = new Date(endTime.getTime() + 5*60*1000); // 5 minutes after expiry
    const expectedEmailTime = new Date(endTime.getTime() + 6*60*1000); // ~6 minutes after expiry
    
    console.log('\n4️⃣ AUTOMATIC SCHEDULER TIMELINE');
    console.log(`📅 Lecture expires at: ${endTime.toLocaleTimeString()}`);
    console.log(`🤖 Next scheduler check: ~${schedulerCheckTime.toLocaleTimeString()}`);
    console.log(`📧 Expected email arrival: ~${expectedEmailTime.toLocaleTimeString()}`);
    
    console.log('\n🎯 FRESH AUTOMATIC TEST READY!');
    console.log('==============================');
    console.log(`⏰ Wait until: ${endTime.toLocaleTimeString()} (lecture expires)`);
    console.log(`🤖 Then wait ~5 more minutes for automatic scheduler detection`);
    console.log(`📧 Email will be sent to: sunard79@gmail.com`);
    console.log(`🚫 NO MANUAL API CALLS - Let the scheduler work naturally!`);
    console.log(`🔍 Monitor server logs around: ${expectedEmailTime.toLocaleTimeString()}`);
    
  } catch (error) {
    console.error('❌ Error in fresh automatic setup:', error.message);
  } finally {
    await connection.end();
  }
}

setupFreshAutomaticTest();