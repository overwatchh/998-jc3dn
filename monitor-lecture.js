// Monitor lecture activity in real-time
const mysql = require('mysql2/promise');

async function monitorLecture() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('👁️  LECTURE MONITORING STARTED');
    console.log('===============================');
    console.log(`🕐 Monitoring started at: ${new Date().toLocaleString()}`);
    
    // Get current lecture info
    const [lectureInfo] = await connection.execute(`
      SELECT 
        s.name as subject_name,
        s.code as subject_code,
        qrss.study_session_id,
        qrss.week_number,
        qrss.qr_code_id,
        v.start_time,
        v.end_time,
        CASE 
          WHEN v.end_time < NOW() THEN 'EXPIRED'
          WHEN v.start_time <= NOW() AND v.end_time > NOW() THEN 'ACTIVE'
          ELSE 'PENDING'
        END as status,
        TIMESTAMPDIFF(MINUTE, NOW(), v.end_time) as minutes_remaining
      FROM validity v
      JOIN qr_code_study_session qrss ON v.qr_code_id = qrss.qr_code_id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235'
      ORDER BY v.end_time DESC
      LIMIT 1
    `);
    
    if (lectureInfo.length > 0) {
      const lecture = lectureInfo[0];
      console.log('\n📚 CURRENT LECTURE STATUS:');
      console.log(`   Subject: ${lecture.subject_name} (${lecture.subject_code})`);
      console.log(`   Session: ${lecture.study_session_id}, Week: ${lecture.week_number}`);
      console.log(`   QR Code: ${lecture.qr_code_id}`);
      console.log(`   Timing: ${new Date(lecture.start_time).toLocaleTimeString()} - ${new Date(lecture.end_time).toLocaleTimeString()}`);
      console.log(`   Status: ${lecture.status}`);
      
      if (lecture.status === 'ACTIVE') {
        console.log(`   ⏰ Minutes remaining: ${lecture.minutes_remaining}`);
      } else if (lecture.status === 'EXPIRED') {
        console.log(`   ⏰ Minutes since expired: ${Math.abs(lecture.minutes_remaining)}`);
      }
    }
    
    // Check current student check-ins
    console.log('\n👥 STUDENT CHECK-INS:');
    const [checkins] = await connection.execute(`
      SELECT 
        u.name as student_name,
        u.email,
        c.checkin_time,
        qrss.study_session_id,
        qrss.week_number
      FROM checkin c
      JOIN user u ON u.id = c.student_id
      JOIN qr_code_study_session qrss ON qrss.id = c.qr_code_study_session_id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235'
      ORDER BY c.checkin_time DESC
      LIMIT 10
    `);
    
    console.log(`   Total check-ins found: ${checkins.length}`);
    
    if (checkins.length > 0) {
      checkins.forEach(checkin => {
        console.log(`   - ${checkin.student_name} (${checkin.email})`);
        console.log(`     Checked in: ${new Date(checkin.checkin_time).toLocaleString()}`);
        console.log(`     Session: ${checkin.study_session_id}, Week: ${checkin.week_number}`);
      });
    } else {
      console.log('   No check-ins recorded yet');
    }
    
    // Check enrolled students
    console.log('\n📋 ENROLLED STUDENTS:');
    const [enrolled] = await connection.execute(`
      SELECT 
        u.name,
        u.email,
        e.date as enrollment_date
      FROM enrolment e
      JOIN user u ON u.id = e.student_id
      JOIN subject s ON s.id = e.subject_id
      WHERE s.code = 'CSCI235'
    `);
    
    console.log(`   Total enrolled: ${enrolled.length}`);
    enrolled.forEach(student => {
      console.log(`   - ${student.name} (${student.email}) - Enrolled: ${student.enrollment_date.toLocaleDateString()}`);
    });
    
    // Check recent database activity (last 5 minutes)
    console.log('\n📊 RECENT ACTIVITY (Last 5 minutes):');
    
    // Check for new validity records
    const [recentValidity] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM validity 
      WHERE qr_code_id IN (
        SELECT qr_code_id FROM qr_code_study_session qrss
        JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
        JOIN subject s ON s.id = sss.subject_id
        WHERE s.code = 'CSCI235'
      )
      AND id > (SELECT COALESCE(MAX(id), 0) - 5 FROM validity)
    `);
    
    // Check for new check-ins in last 5 minutes
    const [recentCheckins] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM checkin c
      JOIN qr_code_study_session qrss ON qrss.id = c.qr_code_study_session_id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235'
      AND c.checkin_time >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    `);
    
    console.log(`   New check-ins (last 5 min): ${recentCheckins[0].count}`);
    
    if (lectureInfo.length > 0 && lectureInfo[0].status === 'EXPIRED') {
      console.log('\n🚨 LECTURE HAS EXPIRED - EMAIL TRIGGER READY!');
      console.log('   You can now trigger the attendance reminder email system');
    } else if (lectureInfo.length > 0 && lectureInfo[0].status === 'ACTIVE') {
      console.log('\n✅ LECTURE IS ACTIVE - Students can check in');
      console.log(`   Email will trigger automatically in ${lectureInfo[0].minutes_remaining} minutes`);
    }
    
    console.log('\n📱 MONITORING COMPLETE');
    console.log(`🕐 Check completed at: ${new Date().toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error monitoring lecture:', error.message);
  } finally {
    await connection.end();
  }
}

monitorLecture();