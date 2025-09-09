const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function newAttendanceTest() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    console.log('🧪 NEW ATTENDANCE TEST');
    console.log('====================');
    
    // Clear ALL previous email logs for clean test
    console.log('🧹 Clearing ALL previous email logs for clean test...');
    await connection.execute(`DELETE FROM email_reminder_logs WHERE subject_id = 1`);
    console.log('✅ All previous email logs cleared');
    
    // Create a fresh test session that ends in 2 minutes
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 8);
    const endTimeIn2Min = new Date(now.getTime() + 120 * 1000).toTimeString().slice(0, 8);

    console.log(`\n🎯 Creating NEW test session:`);
    console.log(`   Day: ${currentDay}`);
    console.log(`   Start: ${currentTime}`);
    console.log(`   End: ${endTimeIn2Min} (in 2 minutes)`);

    // Create fresh test session
    const [sessionResult] = await connection.execute(`
      INSERT INTO study_session (day_of_week, start_time, end_time, type, room_id)
      VALUES (?, ?, ?, 'lecture', 1)
    `, [currentDay, currentTime, endTimeIn2Min]);
    
    const newSessionId = sessionResult.insertId;
    
    // Link to Software Engineering
    await connection.execute(`
      INSERT INTO subject_study_session (subject_id, study_session_id)
      VALUES (1, ?)
    `, [newSessionId]);
    
    // Link to lecturer
    await connection.execute(`
      INSERT INTO lecturer_study_session (lecturer_id, study_session_id)
      VALUES ('QjZgQ0bUhFk3OEW9LyONty1eOU38vCcW', ?)
    `, [newSessionId]);

    console.log(`✅ Created NEW test session ID: ${newSessionId}`);

    console.log(`\n📧 EMAIL TEST EXPECTATIONS:`);
    console.log(`   🎯 You should receive EXACTLY 1 email per student`);
    console.log(`   🎯 Total expected: 1 email (to sunard79@gmail.com)`);
    console.log(`   🎯 NO duplicates, NO multiple emails`);
    
    console.log(`\n⚠️  IMPORTANT SETUP REQUIRED:`);
    console.log(`   1. STOP all running monitors in your terminals (Ctrl+C)`);
    console.log(`   2. CLOSE all terminal windows with monitors`);
    console.log(`   3. Open ONE fresh terminal`);
    console.log(`   4. Run: npm run attendance:monitor`);
    console.log(`   5. DO NOT run multiple monitors!`);
    
    console.log(`\n🕐 Session will trigger at: ${endTimeIn2Min}`);
    console.log(`📧 Watch your email: sunard79@gmail.com`);
    console.log(`🚀 Clean test ready - START ONLY ONE MONITOR!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

newAttendanceTest();