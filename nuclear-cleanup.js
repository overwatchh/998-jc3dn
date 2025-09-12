// Nuclear cleanup - remove EVERYTHING and start fresh
const mysql = require('mysql2/promise');

async function nuclearCleanup() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('💥 NUCLEAR CLEANUP - DESTROY EVERYTHING');
    console.log('=====================================');
    
    // Delete EVERYTHING related to CSCI235
    console.log('🗑️  DELETING EVERYTHING...');
    
    // Delete ALL email logs
    await connection.execute('DELETE FROM email_log WHERE 1=1');
    console.log('   ✅ ALL email logs deleted');
    
    // Delete ALL check-ins for CSCI235
    await connection.execute(`
      DELETE c FROM checkin c
      JOIN qr_code_study_session qrss ON c.qr_code_study_session_id = qrss.id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      WHERE sss.subject_id = 3
    `);
    console.log('   ✅ ALL CSCI235 check-ins deleted');
    
    // Delete ALL QR-study session links for CSCI235  
    await connection.execute(`
      DELETE qrss FROM qr_code_study_session qrss
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      WHERE sss.subject_id = 3
    `);
    console.log('   ✅ ALL CSCI235 QR-session links deleted');
    
    // Delete ALL validity records
    await connection.execute('DELETE FROM validity WHERE 1=1');
    console.log('   ✅ ALL validity records deleted');
    
    // Delete ALL QR codes
    await connection.execute('DELETE FROM qr_code WHERE 1=1');
    console.log('   ✅ ALL QR codes deleted');
    
    // Delete ALL attendance summaries
    await connection.execute('DELETE FROM student_attendance_summary WHERE 1=1');
    console.log('   ✅ ALL attendance summaries deleted');
    
    console.log('💥 NUCLEAR CLEANUP COMPLETE - EVERYTHING DESTROYED!');
    console.log('✅ Database is now completely clean');
    console.log('🔄 Ready for fresh start with no interference');
    
  } catch (error) {
    console.error('❌ Nuclear cleanup error:', error.message);
  } finally {
    await connection.end();
  }
}

nuclearCleanup();