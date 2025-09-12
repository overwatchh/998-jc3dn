// Clean ALL CSCI235 attendance records and setup fresh 4:50 PM test
const mysql = require('mysql2/promise');

async function cleanAllAndSetup450() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🧹 COMPLETE CLEANUP OF ALL CSCI235 DATA + SETUP 4:50 PM TEST');
    console.log('=============================================================');
    
    const subjectId = 3; // CSCI235
    const studySessionId = 18; // CSCI235 study session
    
    console.log('\n1️⃣ COMPLETE CLEANUP - REMOVING ALL CSCI235 ATTENDANCE DATA');
    
    // Remove ALL check-ins for CSCI235 (all weeks)
    console.log('   🗑️  Removing ALL check-ins...');
    const [checkinResult] = await connection.execute(`
      DELETE c FROM checkin c
      JOIN qr_code_study_session qrss ON c.qr_code_study_session_id = qrss.id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      WHERE sss.subject_id = ?
    `, [subjectId]);
    console.log(`       Deleted ${checkinResult.affectedRows} checkin records`);
    
    // Remove ALL QR-study session links for CSCI235 (all weeks)
    console.log('   🗑️  Removing ALL QR-study session links...');
    const [qrSessionResult] = await connection.execute(`
      DELETE qrss FROM qr_code_study_session qrss
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      WHERE sss.subject_id = ?
    `, [subjectId]);
    console.log(`       Deleted ${qrSessionResult.affectedRows} QR-session links`);
    
    // Remove ALL orphaned validity records
    console.log('   🗑️  Removing ALL orphaned validity records...');
    const [validityResult] = await connection.execute(`
      DELETE v FROM validity v
      LEFT JOIN qr_code_study_session qrss ON v.qr_code_id = qrss.qr_code_id
      WHERE qrss.qr_code_id IS NULL
    `);
    console.log(`       Deleted ${validityResult.affectedRows} orphaned validity records`);
    
    // Remove ALL orphaned QR codes
    console.log('   🗑️  Removing ALL orphaned QR codes...');
    const [qrResult] = await connection.execute(`
      DELETE qr FROM qr_code qr
      LEFT JOIN qr_code_study_session qrss ON qr.id = qrss.qr_code_id
      WHERE qrss.qr_code_id IS NULL
    `);
    console.log(`       Deleted ${qrResult.affectedRows} orphaned QR codes`);
    
    // Clean attendance summaries
    console.log('   🗑️  Removing attendance summaries...');
    const [summaryResult] = await connection.execute(
      'DELETE FROM student_attendance_summary WHERE subject_id = ?',
      [subjectId]
    );
    console.log(`       Deleted ${summaryResult.affectedRows} summary records`);
    
    // Clean email logs (if table exists)
    console.log('   🗑️  Cleaning email logs...');
    try {
      const [emailResult] = await connection.execute(`
        DELETE FROM email_log 
        WHERE study_session_id = ?
      `, [studySessionId]);
      console.log(`       Deleted ${emailResult.affectedRows} email log records`);
    } catch (e) {
      console.log('       Email log table may not exist');
    }
    
    console.log('✅ COMPLETE CLEANUP FINISHED - ALL CSCI235 DATA REMOVED!');
    
    // Step 2: Setup fresh 4:50 PM test
    console.log('\n2️⃣ SETTING UP FRESH 4:50 PM AUTOMATIC TEST');
    
    const now = new Date();
    const startTime = new Date(now);
    startTime.setMinutes(startTime.getMinutes() - 20); // Started 20 minutes ago
    
    const endTime = new Date(now);
    endTime.setHours(16, 50, 0, 0); // Will expire at 4:50 PM
    
    const minutesUntilExpiry = Math.ceil((endTime - now) / (1000 * 60));
    
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    console.log(`📅 New lecture timing: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    console.log(`🎯 Will expire at 4:50 PM (in ${minutesUntilExpiry} minutes)`);
    
    // Create brand new QR code
    const [newQrResult] = await connection.execute(
      'INSERT INTO qr_code (createdAt, valid_radius) VALUES (NOW(), 50.0)'
    );
    const qrCodeId = newQrResult.insertId;
    console.log(`📱 Created new QR code (ID: ${qrCodeId})`);
    
    // Create validity record for 4:50 PM expiry
    await connection.execute(
      'INSERT INTO validity (qr_code_id, start_time, end_time) VALUES (?, ?, ?)',
      [qrCodeId, startTime, endTime]
    );
    console.log(`✅ Created validity record: expires at 4:50 PM`);
    
    // Link to CSCI235 study session (Week 5 for this fresh test)
    const weekNumber = 5; // Completely fresh week
    
    await connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, studySessionId, weekNumber]
    );
    console.log(`🔗 Linked to CSCI235 Session ${studySessionId}, Week ${weekNumber}`);
    
    // Verify/re-enroll student
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
    
    // Final verification
    console.log('\n4️⃣ VERIFICATION - FRESH 4:50 PM TEST READY');
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
      console.log(`✅ Fresh test session verified: ${session.subject_code} Week ${session.week_number}`);
      console.log(`   QR Code: ${session.qr_code_id}`);
      console.log(`   Expires: ${new Date(session.end_time).toLocaleTimeString()}`);
      console.log(`   Minutes until expiry: ${session.minutes_until_expiry}`);
    }
    
    console.log('\n🎯 FRESH 4:50 PM AUTOMATIC TEST SETUP COMPLETE!');
    console.log('===============================================');
    console.log(`⏰ Lecture will expire at: 4:50:00 PM`);
    console.log(`📧 Automatic email will be sent to: sunard79@gmail.com`);
    console.log(`🤖 Scheduler will detect within 5 minutes after expiry`);
    console.log(`🔥 Check email around: 4:55 PM`);
    console.log(`🧹 COMPLETELY CLEAN - No previous data interference!`);
    
  } catch (error) {
    console.error('❌ Error in cleanup and setup:', error.message);
  } finally {
    await connection.end();
  }
}

cleanAllAndSetup450();