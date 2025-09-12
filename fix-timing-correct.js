// Fix study session timing with correct time format
const mysql = require('mysql2/promise');

async function fixTimingCorrect() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 Fixing CSCI235 study session timing with correct format...');
    
    // Find CSCI235 study session
    const [session] = await connection.execute(`
      SELECT ss.* 
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
    console.log(`   Current: ${session[0].start_time} - ${session[0].end_time}`);
    console.log(`   Day: ${session[0].day_of_week}`);
    console.log(`   Type: ${session[0].type}`);
    
    // Update with correct TIME format and set day to today
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    console.log(`\n🔄 Updating to today (${dayName}) 2:45 PM - 4:15 PM...`);
    
    await connection.execute(
      'UPDATE study_session SET start_time = ?, end_time = ?, day_of_week = ? WHERE id = ?',
      ['14:45:00', '16:15:00', dayName, sessionId]
    );
    
    console.log('✅ Study session timing updated!');
    
    // Verify the update
    const [updated] = await connection.execute(
      'SELECT * FROM study_session WHERE id = ?',
      [sessionId]
    );
    
    if (updated.length > 0) {
      const u = updated[0];
      console.log(`✅ New timing: ${u.day_of_week} ${u.start_time} - ${u.end_time} (${u.type})`);
    }
    
    console.log('\n🎯 CSCI235 timing fixed successfully!');
    console.log(`📅 Now shows: ${dayName} 2:45 PM - 4:15 PM`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixTimingCorrect();