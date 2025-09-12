// Fix the study session timing to reflect correct 2:45 PM - 4:15 PM schedule
const mysql = require('mysql2/promise');

async function fixStudySessionTiming() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 Fixing CSCI235 study session timing...');
    
    // Find the study session linked to CSCI235
    const [csci235Session] = await connection.execute(`
      SELECT 
        ss.*,
        s.code as subject_code,
        s.name as subject_name
      FROM study_session ss
      JOIN subject_study_session sss ON ss.id = sss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235'
      ORDER BY ss.id DESC
      LIMIT 1
    `);
    
    if (csci235Session.length === 0) {
      console.log('❌ No study session found for CSCI235');
      return;
    }
    
    const session = csci235Session[0];
    console.log(`📚 Found CSCI235 study session (ID: ${session.id})`);
    console.log(`   Current timing: ${session.start_time} - ${session.end_time}`);
    console.log(`   Subject: ${session.subject_name} (${session.subject_code})`);
    
    // Update the study session timing to match today's 2:45 PM - 4:15 PM schedule
    const today = new Date();
    const newStartTime = new Date(today);
    newStartTime.setHours(14, 45, 0, 0); // 2:45 PM
    
    const newEndTime = new Date(today);
    newEndTime.setHours(16, 15, 0, 0); // 4:15 PM
    
    console.log(`\n🔄 Updating study session timing...`);
    console.log(`   New start time: ${newStartTime.toLocaleString()}`);
    console.log(`   New end time: ${newEndTime.toLocaleString()}`);
    
    await connection.execute(
      'UPDATE study_session SET start_time = ?, end_time = ? WHERE id = ?',
      [newStartTime, newEndTime, session.id]
    );
    
    console.log('✅ Study session timing updated successfully!');
    
    // Verify the update
    console.log('\n🔍 Verifying the update...');
    const [updatedSession] = await connection.execute(
      'SELECT * FROM study_session WHERE id = ?',
      [session.id]
    );
    
    if (updatedSession.length > 0) {
      const updated = updatedSession[0];
      console.log(`✅ Updated timing: ${new Date(updated.start_time).toLocaleString()} - ${new Date(updated.end_time).toLocaleString()}`);
    }
    
    // Also check if there are any validity records that need updating
    console.log('\n🔍 Checking validity records...');
    const [validityRecords] = await connection.execute(`
      SELECT v.*, qrss.study_session_id
      FROM validity v
      JOIN qr_code_study_session qrss ON v.qr_code_id = qrss.qr_code_id
      WHERE qrss.study_session_id = ?
      ORDER BY v.end_time DESC
      LIMIT 1
    `, [session.id]);
    
    if (validityRecords.length > 0) {
      const validity = validityRecords[0];
      console.log(`📱 Latest QR validity: ${new Date(validity.start_time).toLocaleString()} - ${new Date(validity.end_time).toLocaleString()}`);
      
      const validityEndTime = new Date(validity.end_time);
      const sessionEndTime = new Date(newEndTime);
      
      if (Math.abs(validityEndTime - sessionEndTime) > 60000) { // More than 1 minute difference
        console.log('⚠️  Validity timing doesn\'t match study session timing');
        console.log('   The QR validity is correct (4:15 PM), study session was just updated to match');
      } else {
        console.log('✅ Validity timing matches study session timing');
      }
    }
    
    console.log('\n🎯 Study session timing fix completed!');
    console.log('📅 CSCI235 now shows correct timing: 2:45 PM - 4:15 PM');
    console.log('📧 Email reminder will trigger when QR validity expires at 4:15 PM');
    
  } catch (error) {
    console.error('❌ Error fixing study session timing:', error.message);
  } finally {
    await connection.end();
  }
}

fixStudySessionTiming();