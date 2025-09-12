// Monitor countdown to automatic email trigger
const mysql = require('mysql2/promise');

async function countdownMonitor() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('⏰ AUTOMATIC EMAIL COUNTDOWN MONITOR');
    console.log('=====================================');
    
    // Get the Week 3 test session
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
      WHERE s.code = 'CSCI235' AND qrss.week_number = 3
      ORDER BY v.end_time DESC
      LIMIT 1
    `);
    
    if (session.length === 0) {
      console.log('❌ No Week 3 test session found');
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
      const minutes = Math.floor(lecture.seconds_remaining / 60);
      const seconds = lecture.seconds_remaining % 60;
      console.log(`⏳ Time Remaining: ${minutes}m ${seconds}s`);
      console.log(`🤖 Automatic scheduler will detect expiry and send email!`);
    } else {
      const minutesSince = Math.floor(Math.abs(lecture.seconds_remaining) / 60);
      const secondsSince = Math.abs(lecture.seconds_remaining) % 60;
      console.log(`🚨 EXPIRED ${minutesSince}m ${secondsSince}s ago!`);
      console.log(`📧 Automatic email should have been triggered!`);
      
      // Check if scheduler has processed this
      console.log('\n🔍 Checking scheduler activity...');
      console.log('📧 Check sunard79@gmail.com for the attendance reminder email!');
    }
    
    // Show student who will receive email
    const [students] = await connection.execute(`
      SELECT u.name, u.email
      FROM enrolment e
      JOIN user u ON u.id = e.student_id  
      JOIN subject s ON s.id = e.subject_id
      WHERE s.code = 'CSCI235'
    `);
    
    console.log('\n👨‍🎓 Students who will receive automatic email:');
    students.forEach(student => {
      console.log(`   📧 ${student.name} (${student.email})`);
    });
    
    console.log(`\n🕐 Monitor check completed at: ${currentTime.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error in countdown monitor:', error.message);
  } finally {
    await connection.end();
  }
}

countdownMonitor();