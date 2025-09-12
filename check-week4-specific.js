// Check specifically what happened with the Week 4 lecture you were running
const mysql = require('mysql2/promise');

async function checkWeek4Specific() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔍 CHECKING YOUR SPECIFIC WEEK 4 LECTURE');
    console.log('=========================================');
    
    // Find the Week 4 session you were running
    const [week4Session] = await connection.execute(`
      SELECT DISTINCT
        qrss.study_session_id,
        qrss.week_number,
        qrss.qr_code_id,
        v.start_time,
        v.end_time,
        s.code as subject_code,
        s.name as subject_name,
        CASE WHEN v.end_time < NOW() THEN 'EXPIRED' ELSE 'ACTIVE' END as status,
        TIMESTAMPDIFF(MINUTE, v.end_time, NOW()) as minutes_since_expired
      FROM qr_code_study_session qrss
      JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235' AND qrss.week_number = 4
      ORDER BY v.end_time DESC
      LIMIT 1
    `);
    
    if (week4Session.length === 0) {
      console.log('❌ No Week 4 CSCI235 session found');
      return;
    }
    
    const session = week4Session[0];
    console.log('📚 YOUR WEEK 4 LECTURE:');
    console.log(`   Subject: ${session.subject_name} (${session.subject_code})`);
    console.log(`   QR Code: ${session.qr_code_id}, Week: ${session.week_number}`);
    console.log(`   Timing: ${new Date(session.start_time).toLocaleTimeString()} - ${new Date(session.end_time).toLocaleTimeString()}`);
    console.log(`   Status: ${session.status}`);
    
    if (session.status === 'EXPIRED') {
      console.log(`   Expired: ${session.minutes_since_expired} minutes ago`);
    }
    
    // Check what the scheduler query would find for Week 4
    console.log('\n🤖 CHECKING IF SCHEDULER CAN DETECT YOUR WEEK 4 LECTURE:');
    const lookbackMinutes = 6; // Scheduler looks back 6 minutes
    
    const [schedulerQuery] = await connection.execute(`
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
        AND s.code = 'CSCI235' 
        AND qrss.week_number = 4
      GROUP BY qrss.study_session_id, qrss.week_number, qrss.qr_code_id, s.code, s.name
      HAVING latest_end_time < NOW()
      ORDER BY latest_end_time DESC
    `, [lookbackMinutes]);
    
    if (schedulerQuery.length > 0) {
      const found = schedulerQuery[0];
      console.log('✅ SCHEDULER CAN FIND YOUR WEEK 4 LECTURE:');
      console.log(`   ${found.subject_code} Week ${found.week_number}, QR: ${found.qr_code_id}`);
      console.log(`   Expired at: ${new Date(found.latest_end_time).toLocaleTimeString()}`);
    } else {
      console.log('❌ SCHEDULER CANNOT FIND YOUR WEEK 4 LECTURE');
      console.log(`   (Either not expired yet or outside ${lookbackMinutes}-minute window)`);
    }
    
    // Check if there were any check-ins for Week 4
    console.log('\n👥 CHECK-INS FOR YOUR WEEK 4 LECTURE:');
    const [checkins] = await connection.execute(`
      SELECT COUNT(*) as checkin_count
      FROM checkin c
      JOIN qr_code_study_session qrss ON c.qr_code_study_session_id = qrss.id
      WHERE qrss.week_number = 4 
        AND qrss.study_session_id = ?
    `, [session.study_session_id]);
    
    console.log(`   Students checked in: ${checkins[0].checkin_count}`);
    
    // Check enrolled students
    const [enrolled] = await connection.execute(`
      SELECT u.name, u.email
      FROM enrolment e
      JOIN user u ON u.id = e.student_id
      JOIN subject s ON s.id = e.subject_id
      WHERE s.code = 'CSCI235'
    `);
    
    console.log('\n👨‍🎓 ENROLLED STUDENTS WHO SHOULD GET EMAIL:');
    enrolled.forEach(student => {
      console.log(`   📧 ${student.name} (${student.email})`);
    });
    
    console.log('\n🎯 SUMMARY FOR YOUR WEEK 4 LECTURE:');
    if (session.status === 'EXPIRED' && schedulerQuery.length > 0) {
      console.log('✅ Your Week 4 lecture expired and should be processed by scheduler');
      console.log('📧 Emails should have been sent to enrolled students');
    } else if (session.status === 'EXPIRED') {
      console.log('⚠️  Your Week 4 lecture expired but may be outside scheduler time window');
    } else {
      console.log('⏳ Your Week 4 lecture has not expired yet');
    }
    
  } catch (error) {
    console.error('❌ Error checking Week 4 lecture:', error.message);
  } finally {
    await connection.end();
  }
}

checkWeek4Specific();