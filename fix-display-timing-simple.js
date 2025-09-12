// Simple fix for study session display timing
const mysql = require('mysql2/promise');

async function fixDisplayTimingSimple() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 FIXING CSCI235 DISPLAY TIMING');
    console.log('===============================');
    
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Set display timing: Started 15 minutes ago, ends in 6 minutes (match our test)
    const displayStartTime = new Date(now);
    displayStartTime.setMinutes(displayStartTime.getMinutes() - 15);
    
    const displayEndTime = new Date(now);
    displayEndTime.setMinutes(displayEndTime.getMinutes() + 6);
    
    const startTimeStr = displayStartTime.toTimeString().substr(0, 8);
    const endTimeStr = displayEndTime.toTimeString().substr(0, 8);
    
    console.log(`📅 Current time: ${now.toLocaleTimeString()}`);
    console.log(`⏰ New display: ${today} ${displayStartTime.toLocaleTimeString()} - ${displayEndTime.toLocaleTimeString()}`);
    
    // Find CSCI235 study session
    const [session] = await connection.execute(`
      SELECT ss.id, ss.type, ss.start_time, ss.end_time, ss.day_of_week
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
    console.log(`📚 Found session ID: ${sessionId}`);
    console.log(`   Current: ${session[0].day_of_week} ${session[0].start_time} - ${session[0].end_time}`);
    
    // Update display timing
    await connection.execute(
      'UPDATE study_session SET start_time = ?, end_time = ?, day_of_week = ? WHERE id = ?',
      [startTimeStr, endTimeStr, today, sessionId]
    );
    
    console.log(`✅ Updated to: ${today} ${startTimeStr} - ${endTimeStr}`);
    
    // Check our automatic test status
    const [testStatus] = await connection.execute(`
      SELECT 
        qrss.week_number,
        v.end_time,
        TIMESTAMPDIFF(SECOND, NOW(), v.end_time) as seconds_remaining,
        CASE WHEN v.end_time <= NOW() THEN 'EXPIRED' ELSE 'ACTIVE' END as status
      FROM qr_code_study_session qrss
      JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235' AND qrss.week_number = 6
    `);
    
    if (testStatus.length > 0) {
      const test = testStatus[0];
      const minutes = Math.floor(Math.abs(test.seconds_remaining) / 60);
      const seconds = Math.abs(test.seconds_remaining) % 60;
      
      console.log(`\n📱 Automatic test: Week ${test.week_number} - ${test.status}`);
      console.log(`   Expires: ${new Date(test.end_time).toLocaleTimeString()}`);
      
      if (test.status === 'ACTIVE') {
        console.log(`   ⏳ ${minutes}m ${seconds}s remaining`);
      } else {
        console.log(`   🚨 Expired ${minutes}m ${seconds}s ago!`);
      }
    }
    
    console.log('\n✅ Display timing fixed! Refresh your browser to see the update.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixDisplayTimingSimple();