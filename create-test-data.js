// Create proper test data for attendance reminder system
const mysql = require('mysql2/promise');

async function createTestData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🔧 Creating test data for attendance reminder system...');
    
    // Set the target expiry time (just passed - 3:39 PM)
    const targetEndTime = new Date();
    targetEndTime.setHours(15, 39, 0, 0); // 3:39 PM (just expired)
    
    console.log(`📅 Target end time: ${targetEndTime}`);
    
    // Step 1: Create a QR code if needed
    console.log('📱 Creating/finding QR code...');
    let qrCodeId;
    
    const [existingQR] = await connection.execute('SELECT id FROM qr_code LIMIT 1');
    if (existingQR.length > 0) {
      qrCodeId = existingQR[0].id;
      console.log(`✅ Using existing QR code ID: ${qrCodeId}`);
    } else {
      const [qrResult] = await connection.execute(
        'INSERT INTO qr_code (createdAt, valid_radius) VALUES (NOW(), 50.0)'
      );
      qrCodeId = qrResult.insertId;
      console.log(`✅ Created new QR code ID: ${qrCodeId}`);
    }
    
    // Step 2: Create validity record with expired end_time
    console.log('⏰ Creating validity record with expired time...');
    
    // First check if validity record exists
    const [existingValidity] = await connection.execute(
      'SELECT * FROM validity WHERE qr_code_id = ?',
      [qrCodeId]
    );
    
    if (existingValidity.length > 0) {
      // Update existing validity record
      await connection.execute(
        'UPDATE validity SET end_time = ? WHERE qr_code_id = ?',
        [targetEndTime, qrCodeId]
      );
      console.log('✅ Updated existing validity record');
    } else {
      // Create new validity record
      const startTime = new Date(targetEndTime);
      startTime.setMinutes(startTime.getMinutes() - 90); // 1.5 hour lecture
      
      await connection.execute(
        'INSERT INTO validity (qr_code_id, start_time, end_time, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [qrCodeId, startTime, targetEndTime]
      );
      console.log('✅ Created new validity record');
    }
    
    // Step 3: Link QR code to study session
    console.log('🔗 Linking QR code to study session...');
    
    const studySessionId = 18; // The one we modified earlier
    const weekNumber = 1;
    
    // Check if link exists
    const [existingLink] = await connection.execute(
      'SELECT * FROM qr_code_study_session WHERE qr_code_id = ? AND study_session_id = ?',
      [qrCodeId, studySessionId]
    );
    
    if (existingLink.length === 0) {
      try {
        await connection.execute(
          'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
          [qrCodeId, studySessionId, weekNumber]
        );
        console.log('✅ Created QR code to study session link');
      } catch (e) {
        console.log('⚠️  Link already exists, continuing...');
      }
    } else {
      await connection.execute(
        'UPDATE qr_code_study_session SET week_number = ? WHERE qr_code_id = ? AND study_session_id = ?',
        [weekNumber, qrCodeId, studySessionId]
      );
      console.log('✅ Updated QR code to study session link');
    }
    
    // Step 4: Verify the data structure
    console.log('🔍 Verifying test data structure...');
    
    const [testQuery] = await connection.execute(`
      SELECT DISTINCT
        qrss.study_session_id,
        qrss.week_number,
        qrss.qr_code_id,
        MAX(v.end_time) as latest_end_time,
        ss.type
      FROM qr_code_study_session qrss
      JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      JOIN study_session ss ON ss.id = qrss.study_session_id
      WHERE ss.type = 'lecture'
        AND v.end_time BETWEEN DATE_SUB(NOW(), INTERVAL 60 MINUTE) AND NOW()
        AND v.end_time < NOW()
      GROUP BY qrss.study_session_id, qrss.week_number, qrss.qr_code_id
      HAVING latest_end_time < NOW()
      ORDER BY latest_end_time DESC
    `);
    
    console.log('📊 Test query results:');
    testQuery.forEach(row => {
      console.log(`  - Session: ${row.study_session_id}, Week: ${row.week_number}, QR: ${row.qr_code_id}, End: ${row.latest_end_time}`);
    });
    
    if (testQuery.length > 0) {
      console.log('🎉 SUCCESS! Test data is properly configured for attendance reminder system!');
    } else {
      console.log('⚠️  No matching records found. The system may not detect this as expired yet.');
    }
    
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  } finally {
    await connection.end();
  }
}

createTestData();