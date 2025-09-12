// Monitor countdown for Week 4 test
const mysql = require('mysql2/promise');

async function countdownWeek4() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('⏰ 5-MINUTE AUTOMATIC EMAIL COUNTDOWN - WEEK 4');
    console.log('==============================================');
    
    // Get the Week 4 test session
    const [session] = await connection.execute(`
      SELECT DISTINCT
        qrss.study_session_id,
        qrss.week_number,
        qrss.qr_code_id,
        v.start_time,
        v.end_time,
        s.code as subject_code,
        s.name as subject_name,
        CASE 
          WHEN v.end_time <= NOW() THEN 'EXPIRED'
          ELSE 'ACTIVE'
        END as status,
        TIMESTAMPDIFF(SECOND, NOW(), v.end_time) as seconds_remaining
      FROM qr_code_study_session qrss
      JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235' AND qrss.week_number = 4
      ORDER BY v.end_time DESC
      LIMIT 1
    `);
    
    if (session.length === 0) {
      console.log('❌ No Week 4 test session found');
      return;
    }
    
    const lecture = session[0];
    const currentTime = new Date();
    const endTime = new Date(lecture.end_time);
    
    console.log(`📚 Subject: ${lecture.subject_name} (${lecture.subject_code})`);
    console.log(`📱 QR Code: ${lecture.qr_code_id}, Week: ${lecture.week_number}`);
    console.log(`⏰ Current Time: ${currentTime.toLocaleTimeString()}`);
    console.log(`🎯 Expires At: ${endTime.toLocaleTimeString()}`);
    console.log(`📊 Status: ${lecture.status}`);
    
    if (lecture.status === 'ACTIVE') {
      const totalSeconds = lecture.seconds_remaining;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      console.log(`⏳ Time Remaining: ${minutes}m ${seconds}s`);
      console.log(`🤖 Automatic scheduler will detect expiry and send email!`);
      
      // Show expected email time
      const expectedEmailTime = new Date(endTime.getTime() + 5*60*1000);
      console.log(`📧 Expected email arrival: ~${expectedEmailTime.toLocaleTimeString()}`);
    } else {
      const totalSecondsSince = Math.abs(lecture.seconds_remaining);
      const minutesSince = Math.floor(totalSecondsSince / 60);
      const secondsSince = totalSecondsSince % 60;
      console.log(`🚨 EXPIRED ${minutesSince}m ${secondsSince}s ago!`);
      console.log(`📧 Automatic email should be triggered soon!`);
    }
    
    // Show countdown with seconds precision
    if (lecture.status === 'ACTIVE') {
      console.log('\n🚀 COUNTDOWN TO AUTOMATIC EMAIL TEST:');
      console.log(`   ⏰ T-minus: ${Math.floor(lecture.seconds_remaining / 60)}:${String(lecture.seconds_remaining % 60).padStart(2, '0')}`);
    }
    
    // Show student
    console.log(`\n👨‍🎓 Email will be sent to: sunard79@gmail.com`);
    console.log(`🕐 Monitor check: ${currentTime.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error in countdown monitor:', error.message);
  } finally {
    await connection.end();
  }
}

countdownWeek4();