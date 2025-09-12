const mysql = require('mysql2/promise');

async function checkCurrentSetup() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔍 Checking current setup for QR generation...');
    
    // Check lecturer account
    const [lecturerResult] = await connection.execute(
      "SELECT id, email FROM user WHERE email = 'dks695@uowmail.edu.au'"
    );
    
    if (lecturerResult.length === 0) {
      console.log('❌ Lecturer dks695@uowmail.edu.au not found');
      return;
    }
    
    const lecturerId = lecturerResult[0].id;
    console.log(`✅ Lecturer found: ${lecturerId} (${lecturerResult[0].email})`);
    
    // First check study_session table structure
    const [ssTableInfo] = await connection.execute("DESCRIBE study_session");
    console.log('\n📋 Study Session table structure:');
    ssTableInfo.forEach(col => console.log(`  ${col.Field}: ${col.Type}`));
    
    // Check current study sessions
    const [sessionResult] = await connection.execute(`
      SELECT 
        ss.*,
        s.code,
        s.name,
        CASE 
          WHEN NOW() BETWEEN ss.start_time AND ss.end_time THEN 'ACTIVE'
          WHEN NOW() < ss.start_time THEN 'NOT STARTED'
          ELSE 'EXPIRED'
        END as status
      FROM study_session ss
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      ORDER BY ss.id DESC
      LIMIT 5
    `);
    
    console.log('\n📚 Recent study sessions:');
    sessionResult.forEach(session => {
      console.log(`  ID: ${session.id}, ${session.code} - ${session.name}`);
      console.log(`    Time: ${new Date(session.start_time).toLocaleTimeString()} - ${new Date(session.end_time).toLocaleTimeString()}`);
      console.log(`    Status: ${session.status}\n`);
    });
    
    // Check lecturer-session links
    const [linkResult] = await connection.execute(`
      SELECT 
        lss.lecturer_id,
        lss.study_session_id,
        ss.type,
        s.code
      FROM lecturer_study_session lss
      JOIN study_session ss ON ss.id = lss.study_session_id
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      WHERE lss.lecturer_id = ?
      ORDER BY lss.study_session_id DESC
    `, [lecturerId]);
    
    console.log(`📎 Lecturer linked to ${linkResult.length} study sessions:`);
    linkResult.forEach(link => {
      console.log(`  Session ${link.study_session_id}: ${link.code} ${link.type}`);
    });
    
    // Check for existing QR codes
    const [qrResult] = await connection.execute(`
      SELECT 
        qr.id,
        qrss.study_session_id,
        v.start_time,
        v.end_time,
        s.code
      FROM qr_code qr
      JOIN qr_code_study_session qrss ON qrss.qr_code_id = qr.id
      JOIN study_session ss ON ss.id = qrss.study_session_id
      JOIN subject_study_session sss ON sss.study_session_id = ss.id
      JOIN subject s ON s.id = sss.subject_id
      LEFT JOIN validity v ON v.qr_code_id = qr.id
      ORDER BY qr.id DESC
    `);
    
    console.log(`\n📱 Existing QR codes: ${qrResult.length}`);
    qrResult.forEach(qr => {
      console.log(`  QR ${qr.id} for session ${qr.study_session_id} (${qr.code})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkCurrentSetup();