const mysql = require('mysql2/promise');

async function fixTiming() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 Fixing lecture timing to be ACTIVE NOW...');
    
    const now = new Date();
    const startTime = new Date(now.getTime() - 10 * 60 * 1000); // Started 10 min ago
    const endTime = new Date(now.getTime() + 30 * 60 * 1000);   // Ends in 30 min
    
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    console.log(`📅 New timing: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    
    // Update the most recent study session timing
    const [updateResult] = await connection.execute(
      'UPDATE study_session SET start_time = ?, end_time = ? WHERE id = (SELECT MAX(id) FROM (SELECT id FROM study_session) AS temp)',
      [startTime, endTime]
    );
    
    console.log(`✅ Updated study session timing (${updateResult.affectedRows} rows)`);
    
    // Verify the current session
    const [checkResult] = await connection.execute(`
      SELECT 
        ss.id,
        ss.start_time,
        ss.end_time,
        s.code,
        s.name,
        NOW() as current_time_value,
        CASE 
          WHEN NOW() BETWEEN ss.start_time AND ss.end_time THEN 'ACTIVE'
          WHEN NOW() < ss.start_time THEN 'NOT STARTED'
          ELSE 'EXPIRED'
        END as status
      FROM study_session ss
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      WHERE ss.id = (SELECT MAX(id) FROM study_session)
    `);
    
    if (checkResult.length > 0) {
      const session = checkResult[0];
      console.log('\n📋 Session Status:');
      console.log(`   Subject: ${session.code} - ${session.name}`);
      console.log(`   Start: ${new Date(session.start_time).toLocaleTimeString()}`);
      console.log(`   End: ${new Date(session.end_time).toLocaleTimeString()}`);
      console.log(`   Current: ${new Date(session.current_time_value).toLocaleTimeString()}`);
      console.log(`   Status: ${session.status}`);
    }
    
    console.log('\n🎯 Lecture should now be ACTIVE for QR generation!');
    
  } catch (error) {
    console.error('❌ Error fixing timing:', error.message);
  } finally {
    await connection.end();
  }
}

fixTiming();