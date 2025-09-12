const mysql = require('mysql2/promise');

async function fixSessionTiming() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 Fixing study session day and time for QR generation...');
    
    // Get current day and time
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM format
    const endTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    const endTimeStr = endTime.toTimeString().split(' ')[0].slice(0, 5); // HH:MM format
    
    console.log(`📅 Current day: ${currentDay}`);
    console.log(`⏰ Current time: ${currentTime}`);
    console.log(`⏰ End time: ${endTimeStr}`);
    
    // Update the most recent study session with correct day and time
    const [updateResult] = await connection.execute(
      'UPDATE study_session SET day_of_week = ?, start_time = ?, end_time = ? WHERE id = 22',
      [currentDay, currentTime, endTimeStr]
    );
    
    console.log(`✅ Updated study session (${updateResult.affectedRows} rows affected)`);
    
    // Verify the update
    const [checkResult] = await connection.execute(`
      SELECT 
        ss.id,
        ss.day_of_week,
        ss.start_time,
        ss.end_time,
        s.code,
        CASE 
          WHEN ss.day_of_week = DAYNAME(NOW()) 
           AND TIME(NOW()) BETWEEN ss.start_time AND ss.end_time
          THEN 'VALID_FOR_QR'
          ELSE 'NOT_VALID_FOR_QR'
        END as qr_validity_status
      FROM study_session ss
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      WHERE ss.id = 22
    `);
    
    if (checkResult.length > 0) {
      const session = checkResult[0];
      console.log('\n📋 Updated Session Details:');
      console.log(`   ID: ${session.id}`);
      console.log(`   Subject: ${session.code}`);
      console.log(`   Day: ${session.day_of_week}`);
      console.log(`   Start: ${session.start_time}`);
      console.log(`   End: ${session.end_time}`);
      console.log(`   QR Generation Status: ${session.qr_validity_status}`);
    }
    
    console.log('\n🎯 Session should now be valid for QR code generation!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixSessionTiming();