const mysql = require('mysql2/promise');

async function checkDatabaseStructure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔍 Checking database structure for enrollment...');
    
    // Check student_study_session table structure
    const [studentSessionTable] = await connection.execute("DESCRIBE student_study_session");
    console.log('\n📋 student_study_session table:');
    studentSessionTable.forEach(col => console.log(`   ${col.Field}: ${col.Type}`));
    
    // Check if student is linked to session 22 directly
    const [directCheck] = await connection.execute(`
      SELECT * FROM student_study_session 
      WHERE student_id = 'Lu7Q8RPLJQW6SzqWfMYvV45PGDXLg0gh'
    `);
    
    console.log(`\n👤 Student direct enrollments: ${directCheck.length}`);
    directCheck.forEach(enrollment => {
      console.log(`   Study Session ID: ${enrollment.study_session_id}`);
    });
    
    // Check if we need to enroll student directly in study session 22
    const [sessionCheck] = await connection.execute(
      'SELECT * FROM student_study_session WHERE student_id = ? AND study_session_id = ?',
      ['Lu7Q8RPLJQW6SzqWfMYvV45PGDXLg0gh', 22]
    );
    
    if (sessionCheck.length === 0) {
      console.log('\n🔧 Enrolling student directly in study session 22...');
      await connection.execute(
        'INSERT INTO student_study_session (student_id, study_session_id) VALUES (?, ?)',
        ['Lu7Q8RPLJQW6SzqWfMYvV45PGDXLg0gh', 22]
      );
      console.log('✅ Student enrolled in session 22');
    } else {
      console.log('✅ Student already enrolled in session 22');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkDatabaseStructure();