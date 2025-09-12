// Quick test for presentation - expires in 2 minutes
const mysql = require('mysql2/promise');

async function quickPresentationTest() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🎯 QUICK PRESENTATION TEST SETUP');
    console.log('================================');
    console.log('⚡ FAST TURNAROUND FOR DEMO!');
    
    const subjectId = 3; // CSCI235
    const studySessionId = 18; // CSCI235 study session
    
    // Clean only Week 7 and 8 data quickly
    console.log('\n1️⃣ QUICK CLEANUP');
    
    // Clean email logs for recent entries
    await connection.execute('DELETE FROM email_log WHERE sent_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)');
    
    // Remove Week 7 and 8 sessions only
    const [qrSessionResult] = await connection.execute(`
      DELETE qrss FROM qr_code_study_session qrss
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      WHERE sss.subject_id = ? AND qrss.week_number IN (7, 8)
    `, [subjectId]);
    console.log(`   ✅ Deleted ${qrSessionResult.affectedRows} recent QR-session links`);
    
    // Remove orphaned validity records
    const [validityResult] = await connection.execute(`
      DELETE v FROM validity v
      LEFT JOIN qr_code_study_session qrss ON v.qr_code_id = qrss.qr_code_id
      WHERE qrss.qr_code_id IS NULL
    `);
    console.log(`   ✅ Deleted ${validityResult.affectedRows} orphaned validity records`);
    
    console.log('✅ QUICK CLEANUP DONE!');
    
    // Step 2: Setup VERY FAST test
    console.log('\n2️⃣ SETTING UP FAST PRESENTATION TEST');
    
    const now = new Date();
    const startTime = new Date(now);
    startTime.setMinutes(startTime.getMinutes() - 10); // Started 10 minutes ago
    
    const endTime = new Date(now);
    endTime.setMinutes(endTime.getMinutes() + 2); // Will expire in ONLY 2 minutes!
    
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    console.log(`📅 Lecture timing: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    console.log(`🎯 Will expire in ONLY 2 minutes at: ${endTime.toLocaleTimeString()}`);
    
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
    console.log(`✅ Created validity record with 2-minute expiry`);
    
    // Link to CSCI235 study session - use Week 8 for presentation
    const weekNumber = 8;
    
    await connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, studySessionId, weekNumber]
    );
    console.log(`🔗 Linked to CSCI235 Session ${studySessionId}, Week ${weekNumber}`);
    
    // Update display timing to match
    const displayStartTime = new Date(now);
    displayStartTime.setMinutes(displayStartTime.getMinutes() - 10);
    
    const displayEndTime = new Date(now);
    displayEndTime.setMinutes(displayEndTime.getMinutes() + 2);
    
    const startTimeStr = displayStartTime.toTimeString().substr(0, 8);
    const endTimeStr = displayEndTime.toTimeString().substr(0, 8);
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    await connection.execute(
      'UPDATE study_session SET start_time = ?, end_time = ?, day_of_week = ? WHERE id = 18',
      [startTimeStr, endTimeStr, today]
    );
    console.log(`✅ Updated display timing to match test`);
    
    // Show FAST timeline
    const schedulerCheckTime = new Date(endTime.getTime() + 5*60*1000); // 5 minutes after expiry
    const expectedEmailTime = new Date(endTime.getTime() + 6*60*1000); // ~6 minutes after expiry
    
    console.log('\n3️⃣ FAST PRESENTATION TIMELINE');
    console.log(`📅 Lecture expires: ${endTime.toLocaleTimeString()}`);
    console.log(`🤖 Scheduler detects: ~${schedulerCheckTime.toLocaleTimeString()}`);
    console.log(`📧 Email arrives: ~${expectedEmailTime.toLocaleTimeString()}`);
    
    const totalWaitMinutes = Math.ceil((expectedEmailTime - now) / (1000 * 60));
    console.log(`⚡ TOTAL WAIT TIME: ~${totalWaitMinutes} minutes from now!`);
    
    console.log('\n🎯 FAST PRESENTATION TEST READY!');
    console.log('================================');
    console.log(`⏰ Expires: ${endTime.toLocaleTimeString()} (2 minutes)`);
    console.log(`📧 Email: ~${expectedEmailTime.toLocaleTimeString()} (${totalWaitMinutes} minutes total)`);
    console.log(`🎪 PERFECT FOR LIVE DEMO!`);
    console.log(`📧 Watch sunard79@gmail.com inbox`);
    
  } catch (error) {
    console.error('❌ Error in quick presentation test:', error.message);
  } finally {
    await connection.end();
  }
}

quickPresentationTest();