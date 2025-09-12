const mysql = require('mysql2/promise');

async function freshSetup() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Deepak7314@',
    database: 'qr_attendance_app'
  });

  try {
    console.log('🧹 COMPLETE SYSTEM RESET AND FRESH SETUP');
    console.log('==========================================');
    
    // Step 1: Clean ALL existing data
    console.log('\n1️⃣ Cleaning ALL existing data...');
    await connection.execute('DELETE FROM checkin');
    console.log('   ✅ Cleared all check-ins');
    
    await connection.execute('DELETE FROM qr_code_study_session');
    console.log('   ✅ Cleared all QR-study session links');
    
    await connection.execute('DELETE FROM validity');
    console.log('   ✅ Cleared all validity records');
    
    await connection.execute('DELETE FROM qr_code');
    console.log('   ✅ Cleared all QR codes');
    
    await connection.execute('DELETE FROM enrolment');
    console.log('   ✅ Cleared all enrollments');
    
    try {
      await connection.execute('DELETE FROM email_log');
      console.log('   ✅ Cleared email logs');
    } catch (e) {
      console.log('   ⚠️ Email log table may not exist');
    }
    
    // Step 2: Set up fresh users
    console.log('\n2️⃣ Setting up users...');
    
    // Check if student exists, if not create
    const [studentCheck] = await connection.execute(
      'SELECT id FROM user WHERE email = ?', 
      ['sunard79@gmail.com']
    );
    
    let studentId;
    if (studentCheck.length === 0) {
      const [studentResult] = await connection.execute(
        'INSERT INTO user (id, email, name, role) VALUES (?, ?, ?, ?)',
        ['student_sunard79', 'sunard79@gmail.com', 'Sunar Dhungana', 'student']
      );
      studentId = 'student_sunard79';
      console.log('   ✅ Created student: sunard79@gmail.com');
    } else {
      studentId = studentCheck[0].id;
      console.log('   ✅ Student exists: sunard79@gmail.com');
    }
    
    // Check if lecturer exists, if not create
    const [lecturerCheck] = await connection.execute(
      'SELECT id FROM user WHERE email = ?', 
      ['dks695@uowmail.edu.au']
    );
    
    let lecturerId;
    if (lecturerCheck.length === 0) {
      const [lecturerResult] = await connection.execute(
        'INSERT INTO user (id, email, name, role) VALUES (?, ?, ?, ?)',
        ['lecturer_dks695', 'dks695@uowmail.edu.au', 'Dr. Deepak Kumar', 'lecturer']
      );
      lecturerId = 'lecturer_dks695';
      console.log('   ✅ Created lecturer: dks695@uowmail.edu.au');
    } else {
      lecturerId = lecturerCheck[0].id;
      console.log('   ✅ Lecturer exists: dks695@uowmail.edu.au');
    }
    
    // Step 3: Set up subject and study session
    console.log('\n3️⃣ Setting up CSCI235 Database Systems...');
    
    // Ensure CSCI235 exists
    const [subjectCheck] = await connection.execute(
      'SELECT id FROM subject WHERE code = ?', 
      ['CSCI235']
    );
    
    let subjectId;
    if (subjectCheck.length === 0) {
      const [subjectResult] = await connection.execute(
        'INSERT INTO subject (code, name) VALUES (?, ?)',
        ['CSCI235', 'Database Systems']
      );
      subjectId = subjectResult.insertId;
      console.log('   ✅ Created subject: CSCI235 Database Systems');
    } else {
      subjectId = subjectCheck[0].id;
      console.log('   ✅ Subject exists: CSCI235 Database Systems');
    }
    
    // Create study session (with room_id)
    const [sessionResult] = await connection.execute(
      'INSERT INTO study_session (type, start_time, end_time, room_id) VALUES (?, NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 1)',
      ['lecture']
    );
    const studySessionId = sessionResult.insertId;
    console.log(`   ✅ Created study session (ID: ${studySessionId})`);
    
    // Link subject to study session
    await connection.execute(
      'INSERT INTO subject_study_session (subject_id, study_session_id) VALUES (?, ?)',
      [subjectId, studySessionId]
    );
    console.log('   ✅ Linked subject to study session');
    
    // Step 4: Enroll student
    console.log('\n4️⃣ Enrolling student...');
    await connection.execute(
      'INSERT INTO enrolment (student_id, subject_id, date) VALUES (?, ?, NOW())',
      [studentId, subjectId]
    );
    console.log('   ✅ Enrolled sunard79@gmail.com in CSCI235');
    
    // Step 5: Create active QR code
    console.log('\n5️⃣ Creating active lecture QR code...');
    
    const now = new Date();
    const endTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
    
    // Create QR code
    const [qrResult] = await connection.execute(
      'INSERT INTO qr_code (createdAt, valid_radius) VALUES (NOW(), 50.0)'
    );
    const qrCodeId = qrResult.insertId;
    console.log(`   📱 Created QR code (ID: ${qrCodeId})`);
    
    // Create validity
    await connection.execute(
      'INSERT INTO validity (qr_code_id, start_time, end_time) VALUES (?, ?, ?)',
      [qrCodeId, now, endTime]
    );
    console.log('   ✅ Created validity record');
    
    // Link QR to study session
    await connection.execute(
      'INSERT INTO qr_code_study_session (qr_code_id, study_session_id, week_number) VALUES (?, ?, ?)',
      [qrCodeId, studySessionId, 1]
    );
    console.log('   🔗 Linked QR to study session');
    
    console.log('\n🎉 FRESH SETUP COMPLETE!');
    console.log('========================');
    console.log(`👨‍🎓 Student: sunard79@gmail.com (ID: ${studentId})`);
    console.log(`👨‍🏫 Lecturer: dks695@uowmail.edu.au (ID: ${lecturerId})`);
    console.log(`📚 Subject: CSCI235 Database Systems (ID: ${subjectId})`);
    console.log(`📱 Active QR Code: ${qrCodeId}`);
    console.log(`⏰ Lecture expires: ${endTime.toLocaleTimeString()}`);
    console.log(`🔗 Visit: http://localhost:3001/qr-generation`);
    console.log('\n🚀 Ready for testing!');
    
  } catch (error) {
    console.error('❌ Error in fresh setup:', error.message);
  } finally {
    await connection.end();
  }
}

freshSetup();