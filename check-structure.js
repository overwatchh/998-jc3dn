// Check table structures
const mysql = require('mysql2/promise');

async function checkStructure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('Checkin table structure:');
    const [checkin] = await connection.execute('DESCRIBE checkin');
    checkin.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    console.log('\nSample checkin records:');
    const [checkinSample] = await connection.execute('SELECT * FROM checkin LIMIT 3');
    checkinSample.forEach(record => {
      console.log(`  - Student: ${record.student_id}, Session: ${record.session_id}, Time: ${record.checkin_time}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkStructure();