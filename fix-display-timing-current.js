// Fix study session display timing to match our current automatic test
const mysql = require('mysql2/promise');

async function fixDisplayTimingCurrent() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 FIXING STUDY SESSION DISPLAY TIMING FOR CURRENT TEST');
    console.log('=====================================================');
    
    // Get current time and create realistic timing for display
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Set display timing: Started 15 minutes ago, ends in 8 minutes (matches our test)
    const displayStartTime = new Date(now);
    displayStartTime.setMinutes(displayStartTime.getMinutes() - 15);
    
    const displayEndTime = new Date(now);
    displayEndTime.setMinutes(displayEndTime.getMinutes() + 8);
    
    const startTimeStr = displayStartTime.toTimeString().substr(0, 8);
    const endTimeStr = displayEndTime.toTimeString().substr(0, 8);
    
    console.log(`📅 Current time: ${now.toLocaleTimeString()}`);
    console.log(`📅 Setting display timing for: ${today}`);
    console.log(`⏰ Display timing: ${displayStartTime.toLocaleTimeString()} - ${displayEndTime.toLocaleTimeString()}`);
    
    // Find CSCI235 study session
    const [session] = await connection.execute(`
      SELECT ss.id, ss.name, ss.type, ss.start_time, ss.end_time, ss.day_of_week
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
    console.log(`📚 Found CSCI235 study session:`);
    console.log(`   ID: ${sessionId}`);
    console.log(`   Name: ${session[0].name}`);
    console.log(`   Type: ${session[0].type}`);
    console.log(`   Current display: ${session[0].day_of_week} ${session[0].start_time} - ${session[0].end_time}`);
    
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
    
    // Show our current automatic test status
    console.log('\n📱 CURRENT AUTOMATIC TEST STATUS:');
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
      WHERE s.code = 'CSCI235' AND qrss.week_number = 6
      ORDER BY v.end_time DESC
      LIMIT 1
    `);
    
    if (testStatus.length > 0) {
      const test = testStatus[0];
      const minutes = Math.floor(Math.abs(test.seconds_remaining) / 60);
      const seconds = Math.abs(test.seconds_remaining) % 60;
      
      console.log(`   📚 ${test.code} Week ${test.week_number}, QR: ${test.qr_code_id}`);
      console.log(`   📅 Expires at: ${new Date(test.end_time).toLocaleTimeString()}`);
      console.log(`   📊 Status: ${test.status}`);
      
      if (test.status === 'ACTIVE') {
        console.log(`   ⏳ Time remaining: ${minutes}m ${seconds}s`);
        const expectedEmailTime = new Date(new Date(test.end_time).getTime() + 5*60*1000);
        console.log(`   📧 Expected automatic email: ~${expectedEmailTime.toLocaleTimeString()}`);
      } else {
        console.log(`   🚨 Expired ${minutes}m ${seconds}s ago - scheduler should detect soon!`);
      }
    }
    
    console.log('\n🎯 DISPLAY TIMING UPDATED!');
    console.log(`📺 CSCI235 now shows: ${today} ${displayStartTime.toLocaleTimeString()} - ${displayEndTime.toLocaleTimeString()}`);
    console.log(`🤖 Automatic test continues - no manual intervention needed!`);
    
  } catch (error) {
    console.error('❌ Error fixing display timing:', error.message);
  } finally {
    await connection.end();
  }
}

fixDisplayTimingCurrent();