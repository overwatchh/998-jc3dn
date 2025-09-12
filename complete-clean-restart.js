// Complete cleanup respecting foreign key constraints
const mysql = require('mysql2/promise');

async function completeCleanRestart() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔄 COMPLETE CLEAN RESTART');
    console.log('========================');
    
    // Clean in proper order to respect foreign key constraints
    
    // 1. Delete ALL email logs first
    await connection.execute('DELETE FROM email_log WHERE 1=1');
    console.log('✅ Email logs cleaned');
    
    // 2. Delete ALL check-ins (has FK to validity)
    await connection.execute('DELETE FROM checkin WHERE 1=1');
    console.log('✅ All check-ins deleted');
    
    // 3. Delete ALL qr_code_study_session links
    await connection.execute('DELETE FROM qr_code_study_session WHERE 1=1');
    console.log('✅ All QR-session links deleted');
    
    // 4. Delete ALL validity records (now safe)
    await connection.execute('DELETE FROM validity WHERE 1=1');
    console.log('✅ All validity records deleted');
    
    // 5. Delete ALL QR codes (now safe)
    await connection.execute('DELETE FROM qr_code WHERE 1=1');
    console.log('✅ All QR codes deleted');
    
    // 6. Clean attendance summaries
    await connection.execute('DELETE FROM student_attendance_summary WHERE 1=1');
    console.log('✅ All attendance summaries deleted');
    
    // 7. Ensure student enrollment
    const studentId = 'Lu7Q8RPLJQW6SzqWfMYvV45PGDXLg0gh';
    await connection.execute(
      'INSERT IGNORE INTO enrolment (student_id, subject_id, date) VALUES (?, ?, NOW())',
      [studentId, 3]
    );
    console.log('✅ Student re-enrolled');
    
    console.log('\n💯 COMPLETE CLEANUP FINISHED!');
    console.log('🔄 Database is now completely clean');
    console.log('⚡ Server restart required to pick up email template changes');
    console.log('📧 Next test will send ONE clean email with correct percentages');
    
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  } finally {
    await connection.end();
  }
}

completeCleanRestart();