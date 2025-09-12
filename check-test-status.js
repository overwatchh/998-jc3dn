const mysql = require('mysql2/promise');

async function checkTestStatus() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔍 Checking 5-minute test lecture status...');
    
    const now = new Date();
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    
    // Check session 24 status
    const [sessionResult] = await connection.execute(`
      SELECT 
        ss.id,
        ss.day_of_week,
        ss.start_time,
        ss.end_time,
        ss.type,
        s.code,
        s.name,
        NOW() as current_db_time,
        CASE 
          WHEN ss.day_of_week = DAYNAME(NOW()) 
           AND TIME(NOW()) BETWEEN ss.start_time AND ss.end_time
          THEN 'ACTIVE'
          WHEN ss.day_of_week = DAYNAME(NOW()) 
           AND TIME(NOW()) > ss.end_time
          THEN 'EXPIRED'
          ELSE 'INACTIVE'
        END as session_status,
        TIMESTAMPDIFF(MINUTE, NOW(), CONCAT(CURDATE(), ' ', ss.end_time)) as minutes_until_end
      FROM study_session ss
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      WHERE ss.id = 24
    `);
    
    if (sessionResult.length > 0) {
      const session = sessionResult[0];
      console.log('\n📚 Test Lecture Status:');
      console.log(`   ID: ${session.id}`);
      console.log(`   Subject: ${session.code} - ${session.name}`);
      console.log(`   Day: ${session.day_of_week}`);
      console.log(`   Time: ${session.start_time} - ${session.end_time}`);
      console.log(`   Current DB Time: ${new Date(session.current_db_time).toLocaleTimeString()}`);
      console.log(`   Status: ${session.session_status}`);
      console.log(`   Minutes until end: ${session.minutes_until_end}`);
      
      if (session.session_status === 'EXPIRED') {
        console.log('\n🎯 LECTURE HAS EXPIRED - Ready for email test!');
      } else if (session.session_status === 'ACTIVE') {
        console.log(`\n⏰ Lecture still active - ${Math.abs(session.minutes_until_end)} minutes remaining`);
      }
    }
    
    // Check QR code status
    const [qrResult] = await connection.execute(`
      SELECT 
        qr.id,
        qrss.week_number,
        qr.createdAt,
        v.start_time,
        v.end_time,
        v.count,
        CASE 
          WHEN NOW() BETWEEN v.start_time AND v.end_time THEN 'ACTIVE'
          WHEN NOW() > v.end_time THEN 'EXPIRED'
          ELSE 'NOT_STARTED'
        END as qr_status
      FROM qr_code qr
      JOIN qr_code_study_session qrss ON qrss.qr_code_id = qr.id
      JOIN validity v ON v.qr_code_id = qr.id
      WHERE qrss.study_session_id = 24
      ORDER BY qr.createdAt DESC, v.count ASC
    `);
    
    console.log(`\n📱 QR Code Status: ${qrResult.length} found`);
    qrResult.forEach(qr => {
      console.log(`   QR ${qr.id} (Week ${qr.week_number}): ${qr.qr_status}`);
      console.log(`     Valid: ${new Date(qr.start_time).toLocaleTimeString()} - ${new Date(qr.end_time).toLocaleTimeString()}`);
    });
    
    // Check if ready for email test
    const hasExpiredQR = qrResult.some(qr => qr.qr_status === 'EXPIRED');
    if (hasExpiredQR) {
      console.log('\n✅ TEST READY: QR codes have expired');
      console.log('🔄 Run email trigger test now!');
    } else {
      console.log('\n⏰ Test not ready yet - QR codes still active');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTestStatus();