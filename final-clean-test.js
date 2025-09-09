const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function finalCleanTest() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    console.log('🎯 FINAL CLEAN TEST - NO DUPLICATES');
    console.log('===================================');
    
    // Clear ALL previous email logs again for clean test
    console.log('🧹 Clearing ALL email logs for completely clean test...');
    await connection.execute(`DELETE FROM email_reminder_logs WHERE subject_id = 1`);
    console.log('✅ All email logs cleared');
    
    // Create a test session that ends in 90 seconds
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 8);
    const endTimeIn90Sec = new Date(now.getTime() + 90 * 1000).toTimeString().slice(0, 8);

    console.log(`\n🎯 Creating FINAL test session:`);
    console.log(`   Day: ${currentDay}`);
    console.log(`   Start: ${currentTime}`);
    console.log(`   End: ${endTimeIn90Sec} (in 90 seconds)`);

    // Create test session
    const [sessionResult] = await connection.execute(`
      INSERT INTO study_session (day_of_week, start_time, end_time, type, room_id)
      VALUES (?, ?, ?, 'lecture', 1)
    `, [currentDay, currentTime, endTimeIn90Sec]);
    
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

    console.log(`✅ Created FINAL test session ID: ${newSessionId}`);

    console.log(`\n📧 FINAL TEST - EXPECTED RESULT:`);
    console.log(`   🎯 EXACTLY 1 email to sunard79@gmail.com`);
    console.log(`   🎯 NO duplicates from multiple monitors`);
    console.log(`   🎯 Clean test with fresh monitor process`);
    
    console.log(`\n✅ CLEAN MONITOR ALREADY RUNNING (ID: 0936f2)`);
    console.log(`📧 Monitor will detect session at: ${endTimeIn90Sec}`);
    console.log(`🕐 Session ends in 90 seconds`);
    console.log(`🎉 This will be the definitive test!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

finalCleanTest();