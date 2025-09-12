const mysql = require('mysql2/promise');

async function monitorSession() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔍 Monitoring current lecture session...');
    
    // Check current session status
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
      WHERE ss.id = 22
    `);
    
    if (sessionResult.length > 0) {
      const session = sessionResult[0];
      console.log('\n📚 Current Session Status:');
      console.log(`   ID: ${session.id}`);
      console.log(`   Subject: ${session.code} - ${session.name}`);
      console.log(`   Day: ${session.day_of_week}`);
      console.log(`   Time: ${session.start_time} - ${session.end_time}`);
      console.log(`   Current DB Time: ${new Date(session.current_db_time).toLocaleTimeString()}`);
      console.log(`   Status: ${session.session_status}`);
      console.log(`   Minutes until end: ${session.minutes_until_end}`);
    }
    
    // Check for QR codes
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
      WHERE qrss.study_session_id = 22
      ORDER BY qr.createdAt DESC, v.count ASC
    `);
    
    console.log(`\n📱 QR Codes: ${qrResult.length}`);
    qrResult.forEach(qr => {
      console.log(`   QR ${qr.id} (Week ${qr.week_number}, Validity ${qr.count}): ${qr.qr_status}`);
      console.log(`     Valid: ${new Date(qr.start_time).toLocaleTimeString()} - ${new Date(qr.end_time).toLocaleTimeString()}`);
    });
    
    // Check student check-ins
    const [checkinResult] = await connection.execute(`
      SELECT 
        c.id,
        c.user_id,
        c.qr_code_id,
        c.check_in_time,
        u.email
      FROM checkin c
      JOIN user u ON u.id = c.user_id
      JOIN qr_code_study_session qrss ON qrss.qr_code_id = c.qr_code_id
      WHERE qrss.study_session_id = 22
      ORDER BY c.check_in_time DESC
    `);
    
    console.log(`\n👥 Student Check-ins: ${checkinResult.length}`);
    checkinResult.forEach(checkin => {
      console.log(`   ${checkin.email} checked in at ${new Date(checkin.check_in_time).toLocaleTimeString()}`);
    });
    
    console.log('\n⏰ Monitoring for email trigger...');
    console.log('   Email scheduler checks every 60 seconds');
    console.log('   Emails sent immediately after lecture expires');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

monitorSession();