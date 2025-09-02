const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function createTestData() {
  console.log('📝 Creating test data for attendance reminders...');
  
  try {
    const db = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
    
    // Create test semester
    await db.query(`
      INSERT IGNORE INTO semesters (name, year) 
      VALUES ('spring', 2025)
    `);
    console.log('✅ Created test semester');
    
    // Create test course
    await db.query(`
      INSERT IGNORE INTO courses (name, code, semester_id, status) 
      VALUES ('Computer Science Fundamentals', 'CS101', 1, 'active')
    `);
    console.log('✅ Created test course');
    
    // Create course sessions
    await db.query(`
      INSERT IGNORE INTO course_sessions (course_id, type, day_of_week, start_time, end_time) VALUES
      (1, 'lecture', 'Monday', '09:00:00', '11:00:00'),
      (1, 'lecture', 'Wednesday', '09:00:00', '11:00:00'),
      (1, 'lab', 'Friday', '14:00:00', '16:00:00')
    `);
    console.log('✅ Created course sessions');
    
    // Create test users (students and lecturer)
    await db.query(`
      INSERT IGNORE INTO user (id, name, email, emailVerified, createdAt, updatedAt, role) VALUES
      ('test-student-1', 'John Doe', 'john.doe@test.com', true, NOW(), NOW(), 'student'),
      ('test-student-2', 'Jane Smith', 'jane.smith@test.com', true, NOW(), NOW(), 'student'),
      ('test-lecturer-1', 'Dr. Professor', 'professor@test.com', true, NOW(), NOW(), 'lecturer')
    `);
    console.log('✅ Created test users');
    
    // Enroll students in course
    await db.query(`
      INSERT IGNORE INTO enrollments (student_id, course_id) VALUES
      ('test-student-1', 1),
      ('test-student-2', 1)
    `);
    console.log('✅ Enrolled students');
    
    // Assign lecturer to course
    await db.query(`
      INSERT IGNORE INTO course_lecturers (course_id, lecturer_id) VALUES
      (1, 'test-lecturer-1')
    `);
    console.log('✅ Assigned lecturer');
    
    // Create attendance summary with low attendance (to trigger reminders)
    await db.query(`
      INSERT INTO student_attendance_summary (student_id, course_id, session_type, total_sessions, attended_sessions, missed_sessions, attendance_percentage) VALUES
      ('test-student-1', 1, 'lecture', 10, 6, 4, 60.00),
      ('test-student-1', 1, 'lab', 8, 4, 4, 50.00),
      ('test-student-2', 1, 'lecture', 10, 8, 2, 80.00),
      ('test-student-2', 1, 'lab', 8, 7, 1, 87.50)
      ON DUPLICATE KEY UPDATE 
        total_sessions = VALUES(total_sessions),
        attended_sessions = VALUES(attended_sessions),
        missed_sessions = VALUES(missed_sessions),
        attendance_percentage = VALUES(attendance_percentage)
    `);
    console.log('✅ Created attendance records (John has low attendance - 60% lectures, 50% labs)');
    
    // Enable email reminders for the course
    await db.query(`
      INSERT INTO email_reminder_settings (course_id, lecture_count, lab_count, attendance_threshold, email_enabled) 
      VALUES (1, 10, 8, 0.80, true)
      ON DUPLICATE KEY UPDATE email_enabled = true
    `);
    console.log('✅ Enabled email reminders for course');
    
    // Show the data
    const [students] = await db.query(`
      SELECT u.name, u.email, sas.session_type, sas.attendance_percentage 
      FROM user u 
      JOIN student_attendance_summary sas ON u.id = sas.student_id 
      WHERE u.role = 'student'
      ORDER BY u.name, sas.session_type
    `);
    
    console.log('\n📊 Test data summary:');
    console.log('Students with attendance:');
    students.forEach(s => {
      const status = s.attendance_percentage < 80 ? '❌ BELOW THRESHOLD' : '✅ Above threshold';
      console.log(`  ${s.name} (${s.email}) - ${s.session_type}: ${s.attendance_percentage}% ${status}`);
    });
    
    await db.end();
    console.log('\n🎉 Test data created successfully!');
    console.log('💡 John Doe should receive reminder emails for both lectures and labs');
    
  } catch (error) {
    console.error('❌ Failed to create test data:', error.message);
  }
}

createTestData();