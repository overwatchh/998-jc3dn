// Complete the test data setup for full end-to-end attendance reminder test
const mysql = require('mysql2/promise');

async function completeTestData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🚀 Completing test data for full end-to-end attendance reminder test...');
    
    const studentId = 'Lu7Q8RPLJQW6SzqWfMYvV45PGDXLg0gh'; // sunard79@gmail.com
    const studySessionId = 1;
    const weekNumber = 1;
    const qrCodeId = 1;
    
    // Step 1: Create/find a subject
    console.log('📚 Creating/finding subject...');
    let subjectId;
    
    const [existingSubjects] = await connection.execute('SELECT * FROM subject LIMIT 1');
    if (existingSubjects.length > 0) {
      subjectId = existingSubjects[0].id;
      console.log(`✅ Using existing subject: ${existingSubjects[0].name} (ID: ${subjectId})`);
    } else {
      const [subjectResult] = await connection.execute(
        'INSERT INTO subject (name, code, description) VALUES (?, ?, ?)',
        ['Computer Science 101', 'CS101', 'Introduction to Computer Science']
      );
      subjectId = subjectResult.insertId;
      console.log(`✅ Created new subject: CS101 (ID: ${subjectId})`);
    }
    
    // Step 2: Link study session to subject
    console.log('🔗 Linking study session to subject...');
    
    // Check if subject_study_session exists
    const [existingSubjectLink] = await connection.execute(
      'SELECT * FROM subject_study_session WHERE subject_id = ? AND study_session_id = ?',
      [subjectId, studySessionId]
    );
    
    if (existingSubjectLink.length === 0) {
      try {
        await connection.execute(
          'INSERT INTO subject_study_session (subject_id, study_session_id) VALUES (?, ?)',
          [subjectId, studySessionId]
        );
        console.log('✅ Created subject-study session link');
      } catch (e) {
        console.log('⚠️  Subject-study session link may already exist');
      }
    } else {
      console.log('✅ Subject-study session link already exists');
    }
    
    // Step 3: Enroll student in subject
    console.log('👨‍🎓 Enrolling student in subject...');
    
    const [existingEnrollment] = await connection.execute(
      'SELECT * FROM enrolment WHERE student_id = ? AND subject_id = ?',
      [studentId, subjectId]
    );
    
    if (existingEnrollment.length === 0) {
      try {
        await connection.execute(
          'INSERT INTO enrolment (student_id, subject_id, semester_id, status) VALUES (?, ?, 1, ?)',
          [studentId, subjectId, 'active']
        );
        console.log('✅ Enrolled student in subject');
      } catch (e) {
        console.log('⚠️  Student enrollment may already exist');
      }
    } else {
      console.log('✅ Student already enrolled in subject');
    }
    
    // Step 4: Create QR session record
    console.log('📱 Creating QR session record...');
    
    const sessionStartTime = new Date();
    sessionStartTime.setHours(14, 0, 0, 0); // 2:00 PM
    const sessionEndTime = new Date();
    sessionEndTime.setHours(15, 39, 0, 0); // 3:39 PM (expired)
    
    // First check session table structure
    console.log('🔍 Checking session table structure...');
    const [sessionStructure] = await connection.execute('DESCRIBE session');
    console.log('Session table columns:');
    sessionStructure.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    // Check if QR session exists (using correct column names)
    const [existingQRSession] = await connection.execute(
      'SELECT * FROM session ORDER BY id DESC LIMIT 1'
    );
    
    let sessionId;
    if (existingQRSession.length === 0) {
      const [sessionResult] = await connection.execute(
        'INSERT INTO session (study_session_id, week_number, start_time, end_time, qr_code_id, status) VALUES (?, ?, ?, ?, ?, ?)',
        [studySessionId, weekNumber, sessionStartTime, sessionEndTime, qrCodeId, 'completed']
      );
      sessionId = sessionResult.insertId;
      console.log(`✅ Created QR session record (ID: ${sessionId})`);
    } else {
      sessionId = existingQRSession[0].id;
      // Update the timing
      await connection.execute(
        'UPDATE session SET start_time = ?, end_time = ?, qr_code_id = ? WHERE id = ?',
        [sessionStartTime, sessionEndTime, qrCodeId, sessionId]
      );
      console.log(`✅ Updated existing QR session record (ID: ${sessionId})`);
    }
    
    // Step 5: Create student attendance record (low attendance for testing)
    console.log('📊 Creating student attendance record...');
    
    const [existingAttendance] = await connection.execute(
      'SELECT * FROM student_study_session WHERE student_id = ? AND study_session_id = ?',
      [studentId, studySessionId]
    );
    
    if (existingAttendance.length === 0) {
      await connection.execute(
        'INSERT INTO student_study_session (student_id, study_session_id, enrolled) VALUES (?, ?, 1)',
        [studentId, studySessionId]
      );
      console.log('✅ Created student-study session record');
    } else {
      console.log('✅ Student-study session record already exists');
    }
    
    // Step 6: Create checkin records (simulate low attendance)
    console.log('✅ Creating checkin records (simulating low attendance)...');
    
    // Create only 1 checkin (45% attendance) to trigger email
    const [existingCheckin] = await connection.execute(
      'SELECT * FROM checkin WHERE student_id = ? AND session_id = ?',
      [studentId, sessionId]
    );
    
    if (existingCheckin.length === 0) {
      await connection.execute(
        'INSERT INTO checkin (student_id, session_id, checkin_time, qr_code_id) VALUES (?, ?, ?, ?)',
        [studentId, sessionId, sessionStartTime, qrCodeId]
      );
      console.log('✅ Created 1 checkin record (45% attendance - will trigger email!)');
    } else {
      console.log('✅ Checkin records already exist');
    }
    
    console.log('\n🎯 TEST DATA SUMMARY:');
    console.log(`📧 Student: Student321 (${studentId}) - sunard79@gmail.com`);
    console.log(`📚 Subject: ${existingSubjects[0]?.name || 'CS101'} (ID: ${subjectId})`);
    console.log(`🏫 Study Session: ${studySessionId}, Week: ${weekNumber}`);
    console.log(`📱 QR Session: ${sessionId}, QR Code: ${qrCodeId}`);
    console.log(`⏰ Session Time: ${sessionStartTime.toLocaleTimeString()} - ${sessionEndTime.toLocaleTimeString()}`);
    console.log(`📊 Attendance: Low (45%) - Will trigger email reminder!`);
    
    console.log('\n🎉 ALL TEST DATA READY FOR FULL END-TO-END TEST!');
    
  } catch (error) {
    console.error('❌ Error completing test data:', error.message);
  } finally {
    await connection.end();
  }
}

completeTestData();