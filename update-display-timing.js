// Update display timing to match current test
const mysql = require('mysql2/promise');

async function updateDisplayTiming() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 UPDATING DISPLAY TIMING');
    console.log('==========================');
    
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Set display timing to match our test: Started 20 min ago, ends in 7 minutes
    const displayStartTime = new Date(now);
    displayStartTime.setMinutes(displayStartTime.getMinutes() - 20);
    
    const displayEndTime = new Date(now);
    displayEndTime.setMinutes(displayEndTime.getMinutes() + 7);
    
    const startTimeStr = displayStartTime.toTimeString().substr(0, 8);
    const endTimeStr = displayEndTime.toTimeString().substr(0, 8);
    
    console.log(`📅 Current time: ${now.toLocaleTimeString()}`);
    console.log(`⏰ New display: ${today} ${displayStartTime.toLocaleTimeString()} - ${displayEndTime.toLocaleTimeString()}`);
    
    // Update CSCI235 study session display timing
    await connection.execute(
      'UPDATE study_session SET start_time = ?, end_time = ?, day_of_week = ? WHERE id = 18',
      [startTimeStr, endTimeStr, today]
    );
    
    console.log('✅ Display timing updated!');
    
    // Verify the update
    const [updated] = await connection.execute(
      'SELECT start_time, end_time, day_of_week FROM study_session WHERE id = 18'
    );
    
    if (updated.length > 0) {
      const u = updated[0];
      console.log(`✅ CSCI235 now shows: ${u.day_of_week} ${u.start_time} - ${u.end_time}`);
    }
    
    // Show our current test status
    const [testStatus] = await connection.execute(`
      SELECT 
        qrss.week_number,
        qrss.qr_code_id,
        v.end_time,
        s.code,
        TIMESTAMPDIFF(SECOND, NOW(), v.end_time) as seconds_remaining,
        CASE WHEN v.end_time <= NOW() THEN 'EXPIRED' ELSE 'ACTIVE' END as status
      FROM qr_code_study_session qrss
      JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235' AND qrss.week_number = 7
    `);
    
    if (testStatus.length > 0) {
      const test = testStatus[0];
      const minutes = Math.floor(Math.abs(test.seconds_remaining) / 60);
      const seconds = Math.abs(test.seconds_remaining) % 60;
      
      console.log(`\n📱 Current test status: ${test.code} Week ${test.week_number}`);
      console.log(`   QR Code: ${test.qr_code_id}`);
      console.log(`   Expires: ${new Date(test.end_time).toLocaleTimeString()}`);
      console.log(`   Status: ${test.status}`);
      
      if (test.status === 'ACTIVE') {
        console.log(`   ⏳ Time remaining: ${minutes}m ${seconds}s`);
      } else {
        console.log(`   🚨 Expired ${minutes}m ${seconds}s ago!`);
      }
    }
    
    console.log('\n✅ DISPLAY UPDATED - AUTOMATIC TEST READY!');
    
  } catch (error) {
    console.error('❌ Error updating display timing:', error.message);
  } finally {
    await connection.end();
  }
}

updateDisplayTiming();