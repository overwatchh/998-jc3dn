// Setup lecture timing for 4:15 PM and prepare for email reminder test
const mysql = require('mysql2/promise');

async function setupLecture415() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🎯 Setting up lecture timing for 4:15 PM test...');
    
    // Find CSCI235 subject
    const [csci235Subject] = await connection.execute(
      'SELECT * FROM subject WHERE code = ?',
      ['CSCI235']
    );
    
    if (csci235Subject.length === 0) {
      console.log('❌ CSCI235 subject not found');
      return;
    }
    
    const subjectId = csci235Subject[0].id;
    console.log(`✅ Found CSCI235 subject (ID: ${subjectId}): ${csci235Subject[0].name}`);
    
    // Find or create a study session for CSCI235
    console.log('\n📚 Setting up study session...');
    
    // Check if we have any available study sessions
    const [availableSessions] = await connection.execute(
      'SELECT * FROM study_session WHERE type = ? ORDER BY id DESC LIMIT 1',
      ['lecture']
    );
    
    let studySessionId;
    if (availableSessions.length > 0) {
      studySessionId = availableSessions[0].id;
      console.log(`✅ Using existing study session (ID: ${studySessionId})`);
    } else {
      // Create a new study session
      const [sessionResult] = await connection.execute(
        'INSERT INTO study_session (type, start_time, end_time, status) VALUES (?, ?, ?, ?)',
        ['lecture', '14:15:00', '16:15:00', 'active']
      );
      studySessionId = sessionResult.insertId;
      console.log(`✅ Created new study session (ID: ${studySessionId})`);
    }
    
    // Link study session to CSCI235 subject
    console.log('🔗 Linking study session to CSCI235...');
    try {
      await connection.execute(
        'INSERT INTO subject_study_session (subject_id, study_session_id) VALUES (?, ?)',
        [subjectId, studySessionId]
      );
      console.log('✅ Created subject-study session link');
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        console.log('✅ Subject-study session link already exists');
      } else {
        throw e;
      }
    }
    
    // Create QR code and validity with 4:15 PM timing
    console.log('\n📱 Creating QR code with 4:15 PM timing...');
    
    // Create QR code
    const [qrResult] = await connection.execute(
      'INSERT INTO qr_code (createdAt, valid_radius) VALUES (NOW(), 50.0)'
    );
    const qrCodeId = qrResult.insertId;
    console.log(`✅ Created QR code (ID: ${qrCodeId})`);
    
    // Set validity timing: 2:45 PM to 4:15 PM (1.5 hour lecture)
    const startTime = new Date();
    startTime.setHours(14, 45, 0, 0); // 2:45 PM
    
    const endTime = new Date();
    endTime.setHours(16, 15, 0, 0); // 4:15 PM
    
    await connection.execute(
      'INSERT INTO validity (qr_code_id, start_time, end_time) VALUES (?, ?, ?)',
      [qrCodeId, startTime, endTime]
    );
    console.log(`✅ Created validity: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    
    // Link QR code to study session
    await connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, studySessionId, 1]
    );
    console.log('✅ Created QR code-study session link for Week 1');
    
    // Enroll students in CSCI235
    console.log('\n👨‍🎓 Enrolling students in CSCI235...');
    
    const studentsToEnroll = [
      'Lu7Q8RPLJQW6SzqWfMYvV45PGDXLg0gh', // sunard79@gmail.com
    ];
    
    for (const studentId of studentsToEnroll) {
      try {
        await connection.execute(
          'INSERT INTO enrolment (student_id, subject_id, semester_id, status) VALUES (?, ?, 1, ?)',
          [studentId, subjectId, 'active']
        );
        console.log(`✅ Enrolled student: ${studentId}`);
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
          console.log(`✅ Student ${studentId} already enrolled`);
        } else {
          console.log(`⚠️  Could not enroll student ${studentId}: ${e.message}`);
        }
      }
    }
    
    // Create student-study session links
    console.log('\n🔗 Creating student-study session links...');
    for (const studentId of studentsToEnroll) {
      try {
        await connection.execute(
          'INSERT INTO student_study_session (student_id, study_session_id, enrolled) VALUES (?, ?, 1)',
          [studentId, studySessionId]
        );
        console.log(`✅ Created student-session link for: ${studentId}`);
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
          console.log(`✅ Student-session link already exists for: ${studentId}`);
        } else {
          console.log(`⚠️  Could not create link for ${studentId}: ${e.message}`);
        }
      }
    }
    
    // Verify the setup with a test query
    console.log('\n🔍 Verifying setup...');
    const [testQuery] = await connection.execute(`
      SELECT DISTINCT
        qrss.study_session_id,
        qrss.week_number,
        qrss.qr_code_id,
        v.start_time,
        v.end_time,
        s.name as subject_name,
        s.code as subject_code
      FROM qr_code_study_session qrss
      JOIN validity v ON v.qr_code_id = qrss.qr_code_id
      JOIN subject_study_session sss ON sss.study_session_id = qrss.study_session_id
      JOIN subject s ON s.id = sss.subject_id
      WHERE s.code = 'CSCI235'
      ORDER BY v.end_time DESC
      LIMIT 1
    `);
    
    if (testQuery.length > 0) {
      const session = testQuery[0];
      console.log('✅ Setup verified:');
      console.log(`   Subject: ${session.subject_name} (${session.subject_code})`);
      console.log(`   Study Session: ${session.study_session_id}, Week: ${session.week_number}`);
      console.log(`   QR Code: ${session.qr_code_id}`);
      console.log(`   Timing: ${new Date(session.start_time).toLocaleTimeString()} - ${new Date(session.end_time).toLocaleTimeString()}`);
      console.log(`   Status: ${new Date(session.end_time) < new Date() ? 'EXPIRED' : 'ACTIVE'}`);
    }
    
    console.log('\n🎯 LECTURE SETUP COMPLETE!');
    console.log(`📅 Lecture scheduled: 2:45 PM - 4:15 PM`);
    console.log(`📧 Email will trigger automatically when lecture expires at 4:15 PM`);
    console.log(`👨‍🎓 Student enrolled: sunard79@gmail.com`);
    
    const now = new Date();
    const timeUntilExpiry = new Date(endTime) - now;
    if (timeUntilExpiry > 0) {
      const minutes = Math.ceil(timeUntilExpiry / (1000 * 60));
      console.log(`⏰ Lecture will expire in ${minutes} minutes`);
    } else {
      console.log(`⏰ Lecture has already expired!`);
    }
    
  } catch (error) {
    console.error('❌ Error setting up lecture:', error.message);
  } finally {
    await connection.end();
  }
}

setupLecture415();