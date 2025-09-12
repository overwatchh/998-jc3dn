// Database test script to check student and modify lecture timing
const mysql = require('mysql2/promise');

async function testDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔍 First, let\'s see what tables exist in the database...');
    
    // Show all tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Available tables:');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    
    console.log('\n🔍 Searching for student: sunard79@gmail.com');
    
    // Check if student exists - try different possible table names
    let studentRows = [];
    try {
      [studentRows] = await connection.execute(
        'SELECT * FROM users WHERE email = ?',
        ['sunard79@gmail.com']
      );
    } catch (e) {
      try {
        [studentRows] = await connection.execute(
          'SELECT * FROM user WHERE email = ?',
          ['sunard79@gmail.com']
        );
      } catch (e2) {
        console.log('Neither users nor user table found, checking all tables...');
      }
    }
    
    if (studentRows.length > 0) {
      console.log('✅ Found student:', studentRows[0]);
    } else {
      console.log('❌ Student with email sunard79@gmail.com not found');
      
      // Let's see what students exist
      const [allStudents] = await connection.execute(
        'SELECT id, email, name, role FROM users LIMIT 10'
      );
      console.log('📋 Available users:');
      allStudents.forEach(user => {
        console.log(`  - ${user.name || 'No Name'} (${user.email}) - Role: ${user.role}`);
      });
    }
    
    console.log('\n🔍 Looking for study sessions (lectures)...');
    
    // Check study_session table
    const [studyStructure] = await connection.execute('DESCRIBE study_session');
    console.log('📋 Study session table structure:');
    studyStructure.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    // Get recent study sessions
    const [sessions] = await connection.execute(
      'SELECT * FROM study_session ORDER BY id DESC LIMIT 5'
    );
    
    if (sessions.length > 0) {
      console.log('📊 Recent study sessions:');
      sessions.forEach(session => {
        console.log(`  - ID: ${session.id}, Start: ${session.start_time}, End: ${session.end_time}, Status: ${session.status}`);
      });
      
      // Let's modify the most recent one to end at 3:38 PM today
      const targetEndTime = new Date();
      targetEndTime.setHours(15, 38, 0, 0); // 3:38 PM
      
      const sessionToModify = sessions[0];
      console.log(`\n🔧 Modifying study session ${sessionToModify.id} to end at ${targetEndTime}`);
      
      await connection.execute(
        'UPDATE study_session SET end_time = ? WHERE id = ?',
        [targetEndTime, sessionToModify.id]
      );
      
      console.log('✅ Study session timing updated successfully!');
      
      // Verify the change
      const [updated] = await connection.execute(
        'SELECT * FROM study_session WHERE id = ?',
        [sessionToModify.id]
      );
      console.log('📅 Updated study session:', updated[0]);
      
    } else {
      console.log('❌ No study sessions found');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await connection.end();
  }
}

testDatabase();