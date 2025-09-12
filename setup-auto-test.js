// Setup a new lecture for full automatic email testing
const mysql = require('mysql2/promise');

async function setupAutoTest() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🚀 Setting up FULL AUTOMATIC email test...');
    
    // Get current time and set lecture to expire in 3 minutes
    const now = new Date();
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    
    const startTime = new Date(now);
    startTime.setMinutes(startTime.getMinutes() - 1); // Started 1 minute ago
    
    const endTime = new Date(now);
    endTime.setMinutes(endTime.getMinutes() + 3); // Will expire in 3 minutes
    
    console.log(`📅 New lecture timing: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    console.log(`⚡ Will expire in 3 minutes for automatic email trigger`);
    
    // Create new QR code for this test
    const [qrResult] = await connection.execute(
      'INSERT INTO qr_code (createdAt, valid_radius) VALUES (NOW(), 50.0)'
    );
    const qrCodeId = qrResult.insertId;
    console.log(`📱 Created new QR code (ID: ${qrCodeId})`);
    
    // Create validity record with 3-minute expiry
    await connection.execute(
      'INSERT INTO validity (qr_code_id, start_time, end_time) VALUES (?, ?, ?)',
      [qrCodeId, startTime, endTime]
    );
    console.log(`✅ Created validity: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    
    // Link to CSCI235 study session (Week 3 for new test)
    const studySessionId = 18; // CSCI235 session
    const weekNumber = 3; // Use Week 3 for this test
    
    await connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, studySessionId, weekNumber]
    );
    console.log(`🔗 Linked QR to CSCI235 Session ${studySessionId}, Week ${weekNumber}`);
    
    // Verify student is still enrolled
    const [enrollment] = await connection.execute(`
      SELECT u.name, u.email 
      FROM enrolment e
      JOIN user u ON u.id = e.student_id
      JOIN subject s ON s.id = e.subject_id
      WHERE s.code = 'CSCI235'
    `);
    
    console.log('\n👥 Enrolled students who will receive emails:');
    enrollment.forEach(student => {
      console.log(`   - ${student.name} (${student.email})`);
    });
    
    // Check if automatic scheduler is running
    console.log('\n🤖 AUTOMATIC SCHEDULER STATUS:');
    console.log('   The system should automatically detect this expired lecture');
    console.log('   and send emails when it expires at:', endTime.toLocaleTimeString());
    
    console.log('\n📧 EMAIL WILL BE SENT TO: sunard79@gmail.com');
    console.log('⏰ AUTOMATIC TRIGGER IN: 3 minutes');
    
    // Show verification query
    console.log('\n🔍 Verification query (will find this session when expired):');
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
      console.log(`✅ Found test session: ${session.subject_code} Week ${session.week_number}`);
      console.log(`   QR Code: ${session.qr_code_id}`);
      console.log(`   Expires: ${new Date(session.end_time).toLocaleTimeString()}`);
      console.log(`   Minutes until expiry: ${session.minutes_until_expiry}`);
    }
    
    console.log('\n🎯 FULL AUTOMATIC TEST SETUP COMPLETE!');
    console.log('🔥 Now wait 3 minutes and check sunard79@gmail.com for the automatic email!');
    
  } catch (error) {
    console.error('❌ Error setting up automatic test:', error.message);
  } finally {
    await connection.end();
  }
}

setupAutoTest();