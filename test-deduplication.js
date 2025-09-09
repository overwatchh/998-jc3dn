const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function testDeduplication() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'qr_attendance_app'
  });

  try {
    console.log('🧹 Clearing previous email logs for clean test...');
    
    // Check if table exists first, then clear
    try {
      const [tables] = await connection.execute(`SHOW TABLES LIKE 'email_reminder_logs'`);
      if (tables.length > 0) {
        await connection.execute(`DELETE FROM email_reminder_logs WHERE subject_id = 1`);
        console.log('✅ Email logs cleared');
      } else {
        console.log('⚠️  email_reminder_logs table does not exist yet');
      }
    } catch (error) {
      console.log('⚠️  Could not clear email logs:', error.message);
    }

    // Create a test session that ends in 90 seconds
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 8);
    const endTimeIn90Sec = new Date(now.getTime() + 90 * 1000).toTimeString().slice(0, 8);

    console.log(`\n🎯 Creating test session for deduplication test:`);
    console.log(`   End time: ${endTimeIn90Sec} (in 90 seconds)`);

    // Create another test session
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

    console.log(`✅ Created test session ID: ${newSessionId}`);

    console.log(`\n🔒 With the new deduplication system:`);
    console.log(`   ✅ Email logs will be created when emails are sent`);
    console.log(`   ✅ Recent email checks will prevent duplicates (6-hour window)`);
    console.log(`   ✅ Only ONE email per student per session should be sent`);
    console.log(`\n⚠️  Important: Start only ONE monitor process, not multiple!`);
    console.log(`\n🚀 Ready to test! Run: npm run attendance:monitor`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

testDeduplication();