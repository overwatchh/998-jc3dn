const mysql = require('mysql2/promise');

async function debugEmailScheduler() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔍 Debugging email scheduler issue...');
    
    // Check environment variables
    console.log('\n📊 Environment Check:');
    console.log(`   AUTO_EMAIL_ENABLED: ${process.env.AUTO_EMAIL_ENABLED}`);
    console.log(`   EMAIL_CHECK_INTERVAL_SECONDS: ${process.env.EMAIL_CHECK_INTERVAL_SECONDS}`);
    console.log(`   SMTP_USER: ${process.env.SMTP_USER}`);
    console.log(`   FROM_EMAIL: ${process.env.FROM_EMAIL}`);
    
    // Check student enrollment
    console.log('\n👥 Student Enrollment Check:');
    const [studentResult] = await connection.execute(`
      SELECT 
        u.id,
        u.email,
        sss.subject_id
      FROM user u
      JOIN student_study_session sss ON sss.student_id = u.id
      JOIN subject_study_session subss ON subss.subject_id = sss.subject_id
      WHERE subss.study_session_id = 22 AND u.email = 'sunard79@gmail.com'
    `);
    
    if (studentResult.length > 0) {
      console.log(`   ✅ Student sunard79@gmail.com is enrolled in session 22`);
    } else {
      console.log(`   ❌ Student sunard79@gmail.com NOT enrolled in session 22`);
      
      // Check if student exists
      const [userCheck] = await connection.execute(
        "SELECT id, email FROM user WHERE email = 'sunard79@gmail.com'"
      );
      if (userCheck.length > 0) {
        console.log(`   ℹ️  Student exists in database (ID: ${userCheck[0].id})`);
        console.log(`   ❌ But not enrolled in the lecture session`);
      } else {
        console.log(`   ❌ Student does not exist in database`);
      }
    }
    
    // Check expired sessions that should trigger emails
    console.log('\n⏰ Expired Sessions Check:');
    const [expiredResult] = await connection.execute(`
      SELECT 
        ss.id as session_id,
        s.code,
        s.name,
        COUNT(DISTINCT sss.student_id) as enrolled_students,
        MAX(v.end_time) as last_qr_expired
      FROM study_session ss
      JOIN subject_study_session subss ON subss.study_session_id = ss.id
      JOIN subject s ON s.id = subss.subject_id
      LEFT JOIN student_study_session sss ON sss.subject_id = s.id
      LEFT JOIN qr_code_study_session qrss ON qrss.study_session_id = ss.id
      LEFT JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      WHERE ss.id = 22
      GROUP BY ss.id, s.code, s.name
    `);
    
    if (expiredResult.length > 0) {
      const session = expiredResult[0];
      console.log(`   Session ${session.session_id}: ${session.code} - ${session.name}`);
      console.log(`   Enrolled students: ${session.enrolled_students}`);
      console.log(`   Last QR expired: ${new Date(session.last_qr_expired).toLocaleTimeString()}`);
      
      if (session.enrolled_students === 0) {
        console.log('   ❌ NO STUDENTS ENROLLED - This is why no emails were sent!');
      }
    }
    
    console.log('\n💡 Diagnosis:');
    console.log('   The enhanced scheduler may not be sending emails because:');
    console.log('   1. Student not enrolled in the specific lecture session');
    console.log('   2. Enhanced scheduler not properly initialized');
    console.log('   3. Email scheduler looking for different criteria');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

debugEmailScheduler();