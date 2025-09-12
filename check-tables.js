// Check table structures for QR attendance system
const mysql = require('mysql2/promise');

async function checkTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    // Check validity table
    console.log('Validity table structure:');
    const [validity] = await connection.execute('DESCRIBE validity');
    validity.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    // Check recent validity records
    console.log('\nRecent validity records:');
    const [recent] = await connection.execute('SELECT * FROM validity ORDER BY end_time DESC LIMIT 3');
    recent.forEach(r => {
      const isExpired = r.end_time < new Date();
      console.log(`  QR: ${r.qr_code_id}, End: ${r.end_time}, Status: ${isExpired ? 'EXPIRED' : 'Active'}`);
    });
    
    // Check if we have the expired session we created
    console.log('\nChecking for our test session:');
    const [testQuery] = await connection.execute(`
      SELECT DISTINCT
        qrss.study_session_id,
        qrss.week_number,
        qrss.qr_code_id,
        MAX(v.end_time) as latest_end_time
      FROM qr_code_study_session qrss
      JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      WHERE v.end_time < NOW()
        AND v.end_time > DATE_SUB(NOW(), INTERVAL 1 HOUR)
      GROUP BY qrss.study_session_id, qrss.week_number, qrss.qr_code_id
      ORDER BY latest_end_time DESC
      LIMIT 1
    `);
    
    if (testQuery.length > 0) {
      const session = testQuery[0];
      console.log(`✅ Found expired test session: Study Session ${session.study_session_id}, Week ${session.week_number}, QR ${session.qr_code_id}`);
      console.log(`   Expired at: ${session.latest_end_time}`);
    } else {
      console.log('❌ No expired sessions found within the last hour');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTables();