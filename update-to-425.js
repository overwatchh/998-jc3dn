// Update the Week 3 test lecture to expire at 4:25 PM
const mysql = require('mysql2/promise');

async function updateTo425() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 Updating lecture timing to 4:25 PM expiry...');
    
    // Find the Week 3 validity record
    const [currentSession] = await connection.execute(`
      SELECT v.id, v.qr_code_id, v.end_time
      FROM validity v
      JOIN qr_code_study_session qrss ON v.qr_code_id = qrss.qr_code_id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235' AND qrss.week_number = 3
      ORDER BY v.id DESC
      LIMIT 1
    `);
    
    if (currentSession.length === 0) {
      console.log('❌ Week 3 session not found');
      return;
    }
    
    const validityId = currentSession[0].id;
    const qrCodeId = currentSession[0].qr_code_id;
    const oldEndTime = new Date(currentSession[0].end_time);
    
    console.log(`📱 Found QR Code ${qrCodeId}, Validity ID: ${validityId}`);
    console.log(`⏰ Current expiry: ${oldEndTime.toLocaleTimeString()}`);
    
    // Set new end time to 4:25 PM
    const newEndTime = new Date();
    newEndTime.setHours(16, 25, 0, 0); // 4:25:00 PM
    
    // Set start time to 1 hour earlier
    const newStartTime = new Date(newEndTime);
    newStartTime.setHours(15, 25, 0, 0); // 3:25:00 PM
    
    console.log(`🔄 Updating to: ${newStartTime.toLocaleTimeString()} - ${newEndTime.toLocaleTimeString()}`);
    
    // Update the validity record
    await connection.execute(
      'UPDATE validity SET start_time = ?, end_time = ? WHERE id = ?',
      [newStartTime, newEndTime, validityId]
    );
    
    console.log('✅ Validity timing updated successfully!');
    
    // Verify the update
    const [updated] = await connection.execute(
      'SELECT * FROM validity WHERE id = ?',
      [validityId]
    );
    
    if (updated.length > 0) {
      const u = updated[0];
      console.log(`✅ New timing: ${new Date(u.start_time).toLocaleTimeString()} - ${new Date(u.end_time).toLocaleTimeString()}`);
    }
    
    // Calculate time remaining
    const now = new Date();
    const timeUntilExpiry = newEndTime - now;
    const minutesRemaining = Math.ceil(timeUntilExpiry / (1000 * 60));
    
    console.log('\n🎯 UPDATED AUTOMATIC TEST STATUS:');
    console.log(`📅 New expiry time: 4:25 PM`);
    console.log(`⏰ Minutes until automatic email: ${minutesRemaining}`);
    console.log(`📧 Email will be sent to: sunard79@gmail.com`);
    console.log(`🤖 Automatic scheduler will trigger around 4:25-4:30 PM`);
    
    console.log('\n✅ Update completed! Wait for automatic email at 4:25 PM!');
    
  } catch (error) {
    console.error('❌ Error updating timing:', error.message);
  } finally {
    await connection.end();
  }
}

updateTo425();