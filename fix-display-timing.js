// Fix study session display timing to match current test
const mysql = require('mysql2/promise');

async function fixDisplayTiming() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 Fixing study session display timing...');
    
    // Get current time and create realistic timing
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Set the study session to show current realistic timing
    // Start time: 30 minutes ago, End time: 30 minutes from now
    const displayStartTime = new Date(now);
    displayStartTime.setMinutes(displayStartTime.getMinutes() - 30);
    
    const displayEndTime = new Date(now);
    displayEndTime.setMinutes(displayEndTime.getMinutes() + 30);
    
    const startTimeStr = displayStartTime.toTimeString().substr(0, 8); // HH:MM:SS format
    const endTimeStr = displayEndTime.toTimeString().substr(0, 8);
    
    console.log(`📅 Updating study session display timing:`);
    console.log(`   Day: ${today}`);
    console.log(`   New display timing: ${displayStartTime.toLocaleTimeString()} - ${displayEndTime.toLocaleTimeString()}`);
    
    // Find CSCI235 study session
    const [session] = await connection.execute(`
      SELECT ss.id 
      FROM study_session ss
      JOIN subject_study_session sss ON ss.id = sss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235'
      LIMIT 1
    `);
    
    if (session.length === 0) {
      console.log('❌ No CSCI235 study session found');
      return;
    }
    
    const sessionId = session[0].id;
    console.log(`📚 Found CSCI235 study session (ID: ${sessionId})`);
    
    // Update the study session timing for display
    await connection.execute(
      'UPDATE study_session SET start_time = ?, end_time = ?, day_of_week = ? WHERE id = ?',
      [startTimeStr, endTimeStr, today, sessionId]
    );
    
    console.log('✅ Study session display timing updated!');
    
    // Verify the update
    const [updated] = await connection.execute(
      'SELECT * FROM study_session WHERE id = ?',
      [sessionId]
    );
    
    if (updated.length > 0) {
      const u = updated[0];
      console.log(`✅ New display: ${u.day_of_week} ${u.start_time} - ${u.end_time} (${u.type})`);
    }
    
    // Show the actual QR validity timing (which is correct for the email test)
    console.log('\n📱 QR Validity Status (for email test):');
    const [validity] = await connection.execute(`
      SELECT v.end_time, qrss.week_number,
             TIMESTAMPDIFF(SECOND, NOW(), v.end_time) as seconds_remaining
      FROM validity v
      JOIN qr_code_study_session qrss ON v.qr_code_id = qrss.qr_code_id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235' AND qrss.week_number = 4
      ORDER BY v.end_time DESC
      LIMIT 1
    `);
    
    if (validity.length > 0) {
      const v = validity[0];
      const minutes = Math.floor(v.seconds_remaining / 60);
      const seconds = v.seconds_remaining % 60;
      console.log(`   Week ${v.week_number} QR expires: ${new Date(v.end_time).toLocaleTimeString()}`);
      console.log(`   Time remaining: ${minutes}m ${seconds}s`);
    }
    
    console.log('\n🎯 DISPLAY TIMING FIXED!');
    console.log('📺 CSCI235 should now show current day and realistic timing in the UI');
    console.log('⏰ QR validity still set for automatic email test in ~3 minutes');
    
  } catch (error) {
    console.error('❌ Error fixing display timing:', error.message);
  } finally {
    await connection.end();
  }
}

fixDisplayTiming();