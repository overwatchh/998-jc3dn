// Fix email_log table structure to match scheduler expectations
const mysql = require('mysql2/promise');

async function fixEmailLogTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 FIXING EMAIL LOG TABLE STRUCTURE');
    console.log('==================================');
    
    // Check current table structure
    console.log('1️⃣ Checking current email_log table structure...');
    try {
      const [currentColumns] = await connection.execute('DESCRIBE email_log');
      console.log('   Current columns:');
      currentColumns.forEach(col => {
        console.log(`      - ${col.Field} (${col.Type})`);
      });
    } catch (e) {
      console.log('   ❌ Email log table does not exist');
    }
    
    // Drop and recreate table with correct structure for scheduler
    console.log('\n2️⃣ Creating correct email_log table structure...');
    
    await connection.execute('DROP TABLE IF EXISTS email_log');
    
    await connection.execute(`
      CREATE TABLE email_log (
        id INT PRIMARY KEY AUTO_INCREMENT,
        study_session_id INT,
        week_number INT,
        student_id VARCHAR(36),
        student_email VARCHAR(255) NOT NULL,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session_week (study_session_id, week_number),
        INDEX idx_sent_at (sent_at)
      )
    `);
    
    console.log('✅ Email log table created with correct structure');
    
    // Verify new structure
    console.log('\n3️⃣ Verifying new table structure...');
    const [newColumns] = await connection.execute('DESCRIBE email_log');
    console.log('   New columns:');
    newColumns.forEach(col => {
      console.log(`      - ${col.Field} (${col.Type})`);
    });
    
    // Test the automatic scheduler now
    console.log('\n4️⃣ Testing if scheduler will work now...');
    
    // Check if our Week 6 session can be detected again
    const [testSession] = await connection.execute(`
      SELECT DISTINCT
        qrss.study_session_id,
        qrss.week_number,
        qrss.qr_code_id,
        MAX(v.end_time) as latest_end_time,
        s.code as subject_code,
        s.name as subject_name,
        TIMESTAMPDIFF(MINUTE, v.end_time, NOW()) as minutes_since_expired
      FROM qr_code_study_session qrss
      JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      JOIN study_session ss ON ss.id = qrss.study_session_id
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235' 
        AND qrss.week_number = 6
        AND ss.type = 'lecture'
        AND v.end_time < NOW()
      GROUP BY qrss.study_session_id, qrss.week_number, qrss.qr_code_id, s.code, s.name
      HAVING latest_end_time < NOW()
    `);
    
    if (testSession.length > 0) {
      const session = testSession[0];
      console.log(`   ✅ Found testable session: ${session.subject_code} Week ${session.week_number}`);
      console.log(`      Expired: ${session.minutes_since_expired} minutes ago`);
      console.log(`      Study session ID: ${session.study_session_id}`);
      
      // Check for duplicates (should be none now)
      const [duplicateCheck] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM email_log 
        WHERE study_session_id = ? 
          AND week_number = ? 
          AND sent_at > DATE_SUB(NOW(), INTERVAL 2 HOUR)
      `, [session.study_session_id, session.week_number]);
      
      console.log(`      Recent email log entries: ${duplicateCheck[0].count}`);
      
      if (duplicateCheck[0].count === 0) {
        console.log('      🎯 Session is eligible for processing by scheduler');
      } else {
        console.log('      ⚠️  Session already processed recently');
      }
      
    } else {
      console.log('   ❌ No eligible sessions found for testing');
    }
    
    console.log('\n🎯 EMAIL LOG TABLE FIXED!');
    console.log('   - Table structure now matches scheduler expectations');
    console.log('   - Scheduler should be able to log emails properly');
    console.log('   - Next scheduler run should process Week 6 session');
    console.log('   - Wait for next 5-minute scheduler cycle or restart server');
    
  } catch (error) {
    console.error('❌ Error fixing email log table:', error.message);
  } finally {
    await connection.end();
  }
}

fixEmailLogTable();