// Quick setup for presentation - expires in 3 minutes
const mysql = require('mysql2/promise');

async function quickPresentationSetup() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('⚡ QUICK PRESENTATION SETUP');
    console.log('===========================');
    
    // Clean recent data
    await connection.execute('DELETE FROM email_log WHERE sent_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)');
    
    // Remove Week 11 if exists
    await connection.execute(`
      DELETE qrss FROM qr_code_study_session qrss
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      WHERE sss.subject_id = 3 AND qrss.week_number = 11
    `);
    
    // Clean orphaned records
    await connection.execute(`
      DELETE v FROM validity v
      LEFT JOIN qr_code_study_session qrss ON v.qr_code_id = qrss.qr_code_id
      WHERE qrss.qr_code_id IS NULL
    `);
    
    // Setup timing - expires in 3 minutes
    const now = new Date();
    const startTime = new Date(now);
    startTime.setMinutes(startTime.getMinutes() - 10);
    
    const endTime = new Date(now);
    endTime.setMinutes(endTime.getMinutes() + 3); // 3 minutes from now
    
    console.log(`⏰ Current: ${now.toLocaleTimeString()}`);
    console.log(`🎯 Expires: ${endTime.toLocaleTimeString()} (3 minutes)`);
    
    // Create QR code and validity
    const [qrResult] = await connection.execute(
      'INSERT INTO qr_code (createdAt, valid_radius) VALUES (NOW(), 50.0)'
    );
    const qrCodeId = qrResult.insertId;
    
    await connection.execute(
      'INSERT INTO validity (qr_code_id, start_time, end_time) VALUES (?, ?, ?)',
      [qrCodeId, startTime, endTime]
    );
    
    // Link to Week 11
    await connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, 18, 11]
    );
    
    // Update display
    const startTimeStr = startTime.toTimeString().substr(0, 8);
    const endTimeStr = endTime.toTimeString().substr(0, 8);
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    await connection.execute(
      'UPDATE study_session SET start_time = ?, end_time = ?, day_of_week = ? WHERE id = 18',
      [startTimeStr, endTimeStr, today]
    );
    
    console.log(`📱 QR Code: ${qrCodeId}, Week: 11`);
    console.log(`📧 Email at: ~${new Date(endTime.getTime() + 2*60*1000).toLocaleTimeString()}`);
    console.log('✅ Ready for presentation!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

quickPresentationSetup();