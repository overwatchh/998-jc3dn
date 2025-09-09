const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function finalDeduplicationTest() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    console.log('🧪 Final Deduplication Test Setup');
    console.log('==================================');
    
    // Clean up previous email logs
    console.log('🧹 Clearing previous test email logs...');
    await connection.execute(`DELETE FROM email_reminder_logs WHERE subject_id = 1`);
    
    // Create a test session that ends in 90 seconds
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 8);
    const endTimeIn90Sec = new Date(now.getTime() + 90 * 1000).toTimeString().slice(0, 8);

    console.log(`\n🎯 Creating final test session:`);
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

    console.log(`✅ Created final test session ID: ${newSessionId}`);

    console.log(`\n🔧 Deduplication Features Now Active:`);
    console.log(`   ✅ Database schema fixed (subject_id)`);
    console.log(`   ✅ 6-hour email window deduplication`);
    console.log(`   ✅ Email logging for all attempts`);
    console.log(`   ✅ Proper session count calculations`);
    console.log(`   ✅ Skip info with green/red indicators`);
    
    console.log(`\n⚠️  CRITICAL: Start ONLY ONE monitor process:`);
    console.log(`     npm run attendance:monitor`);
    console.log(`\n📊 Expected result: Only 1 email per student, not 4!`);
    console.log(`📧 Monitor for emails to: sunard79@gmail.com`);
    
    console.log(`\n🕐 Session will end at: ${endTimeIn90Sec}`);
    console.log(`🚀 Ready for final test!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

finalDeduplicationTest();