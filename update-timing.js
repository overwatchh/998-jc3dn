const mysql = require('mysql2/promise');

async function updateTiming() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 Updating CSCI235 lecture timing...');
    
    const now = new Date();
    console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
    
    // Set end time to 5 minutes from now
    const newEndTime = new Date(now.getTime() + 5 * 60 * 1000);
    console.log(`🎯 New expiry time: ${newEndTime.toLocaleTimeString()}`);
    
    // Find current CSCI235 QR session
    const [sessions] = await connection.execute(`
      SELECT qrss.qr_code_id, v.id as validity_id, v.end_time
      FROM qr_code_study_session qrss
      JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235'
      ORDER BY v.end_time DESC
      LIMIT 1
    `);
    
    if (sessions.length === 0) {
      console.log('❌ No CSCI235 session found');
      return;
    }
    
    const session = sessions[0];
    console.log(`📱 Found QR Code: ${session.qr_code_id}, Validity ID: ${session.validity_id}`);
    console.log(`📅 Current end time: ${new Date(session.end_time).toLocaleTimeString()}`);
    
    // Update the end time
    await connection.execute(
      'UPDATE validity SET end_time = ? WHERE id = ?',
      [newEndTime, session.validity_id]
    );
    
    console.log('✅ Timing updated successfully!');
    console.log(`🎯 Lecture will now expire at: ${newEndTime.toLocaleTimeString()}`);
    console.log(`📧 Enhanced scheduler should send email around: ${new Date(newEndTime.getTime() + 60 * 1000).toLocaleTimeString()}`);
    
  } catch (error) {
    console.error('❌ Error updating timing:', error.message);
  } finally {
    await connection.end();
  }
}

updateTiming();