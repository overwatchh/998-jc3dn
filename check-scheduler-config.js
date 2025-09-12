// Check scheduler configuration and time windows
const mysql = require('mysql2/promise');

async function checkSchedulerConfig() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔍 SCHEDULER CONFIGURATION CHECK');
    console.log('=================================');
    
    // Check the scheduler time window
    const checkInterval = 5; // Default 5 minutes
    const lookbackMinutes = checkInterval + 1; // 6 minutes total
    
    console.log(`📅 Scheduler checks every: ${checkInterval} minutes`);
    console.log(`⏰ Looks for sessions expired in last: ${lookbackMinutes} minutes`);
    
    // Get our test session
    const [session] = await connection.execute(`
      SELECT DISTINCT
        qrss.study_session_id,
        qrss.week_number,
        qrss.qr_code_id,
        v.end_time,
        s.code as subject_code,
        s.name as subject_name,
        TIMESTAMPDIFF(MINUTE, NOW(), v.end_time) as minutes_until_expiry,
        CASE WHEN v.end_time < NOW() THEN 
          TIMESTAMPDIFF(MINUTE, v.end_time, NOW())
        ELSE 0 END as minutes_since_expired
      FROM qr_code_study_session qrss
      JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235' AND qrss.week_number = 3
      ORDER BY v.end_time DESC
      LIMIT 1
    `);
    
    if (session.length === 0) {
      console.log('❌ Test session not found');
      return;
    }
    
    const testSession = session[0];
    const currentTime = new Date();
    const endTime = new Date(testSession.end_time);
    const isExpired = endTime < currentTime;
    
    console.log('\n📊 TEST SESSION STATUS:');
    console.log(`   Subject: ${testSession.subject_code} Week ${testSession.week_number}`);
    console.log(`   QR Code: ${testSession.qr_code_id}`);
    console.log(`   End Time: ${endTime.toLocaleTimeString()}`);
    console.log(`   Current Time: ${currentTime.toLocaleTimeString()}`);
    console.log(`   Status: ${isExpired ? 'EXPIRED' : 'ACTIVE'}`);
    
    if (isExpired) {
      console.log(`   Minutes since expired: ${testSession.minutes_since_expired}`);
      if (testSession.minutes_since_expired <= lookbackMinutes) {
        console.log('   ✅ WITHIN SCHEDULER WINDOW - Will be detected!');
      } else {
        console.log('   ⚠️  OUTSIDE SCHEDULER WINDOW - Will NOT be detected!');
        console.log(`   🔧 Session expired ${testSession.minutes_since_expired} minutes ago`);
        console.log(`   🔧 Scheduler only looks ${lookbackMinutes} minutes back`);
      }
    } else {
      console.log(`   Minutes until expiry: ${Math.abs(testSession.minutes_until_expiry)}`);
      console.log('   ⏳ Waiting for expiry...');
    }
    
    // Test the exact query the scheduler uses
    console.log('\n🔍 TESTING SCHEDULER QUERY:');
    const [schedulerTest] = await connection.execute(`
      SELECT DISTINCT
        qrss.study_session_id,
        qrss.week_number,
        qrss.qr_code_id,
        MAX(v.end_time) as latest_end_time,
        s.code as subject_code,
        s.name as subject_name
      FROM qr_code_study_session qrss
      JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      JOIN study_session ss ON ss.id = qrss.study_session_id
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      WHERE ss.type = 'lecture'
        AND v.end_time BETWEEN DATE_SUB(NOW(), INTERVAL ? MINUTE) AND NOW()
        AND v.end_time < NOW()
      GROUP BY qrss.study_session_id, qrss.week_number, qrss.qr_code_id, s.code, s.name
      HAVING latest_end_time < NOW()
      ORDER BY latest_end_time DESC
    `, [lookbackMinutes]);
    
    console.log(`   Found ${schedulerTest.length} sessions that would be processed`);
    
    if (schedulerTest.length > 0) {
      schedulerTest.forEach(s => {
        console.log(`   - ${s.subject_code} Week ${s.week_number} (QR: ${s.qr_code_id})`);
        console.log(`     Expired: ${new Date(s.latest_end_time).toLocaleTimeString()}`);
      });
      console.log('   ✅ Our test session WILL be found by scheduler!');
    } else {
      console.log('   ⚠️  Our test session will NOT be found by scheduler yet');
    }
    
  } catch (error) {
    console.error('❌ Error checking scheduler:', error.message);
  } finally {
    await connection.end();
  }
}

checkSchedulerConfig();