const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const createTablesSQL = `
-- Semester definitions
CREATE TABLE IF NOT EXISTS semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('autumn', 'spring', 'summer') NOT NULL,
    year YEAR NOT NULL,
    UNIQUE(name, year)
);

-- Courses linked to semester
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    semester_id INT NOT NULL,
    status ENUM('active', 'finished') NOT NULL,
    FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

-- Assign lecturer(s) to course
CREATE TABLE IF NOT EXISTS course_lecturers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    lecturer_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (lecturer_id) REFERENCES user(id),
    UNIQUE(course_id, lecturer_id)
);

-- Physical location for sessions
CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    building_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    description VARCHAR(240) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    CONSTRAINT unique_building_room UNIQUE (building_name, room_number, description)
);

-- Weekly recurring sessions (lecture or lab)
CREATE TABLE IF NOT EXISTS course_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    type ENUM('lecture', 'lab') NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location_id INT,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- Student enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    course_id INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES user(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE (student_id, course_id)
);

-- Generated QR codes per session instance
CREATE TABLE IF NOT EXISTS session_qr_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_session_id INT NOT NULL,
    qr_code VARCHAR(12) NOT NULL,
    generated_at DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,
    week_number INT NOT NULL,    
    radius INT NOT NULL DEFAULT 100,
    FOREIGN KEY (course_session_id) REFERENCES course_sessions(id),
    CONSTRAINT unique_qr_code UNIQUE (qr_code),
    CONSTRAINT unique_session_week UNIQUE (course_session_id, week_number)
);

-- Student attendance logs
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    session_id INT NOT NULL,
    qr_code_id INT,
    checkin_time DATETIME NOT NULL,    
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    verify_distance BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (student_id) REFERENCES user(id),
    FOREIGN KEY (session_id) REFERENCES course_sessions(id),
    FOREIGN KEY (qr_code_id) REFERENCES session_qr_codes(id)    
);

-- Email reminder settings table
CREATE TABLE IF NOT EXISTS email_reminder_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    lecture_count INT NOT NULL DEFAULT 13,
    lab_count INT NOT NULL DEFAULT 12,
    attendance_threshold DECIMAL(3,2) NOT NULL DEFAULT 0.80,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE(course_id)
);

-- Email reminder logs to track sent reminders
CREATE TABLE IF NOT EXISTS email_reminder_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    course_id INT NOT NULL,
    reminder_type ENUM('first_absence', 'second_absence', 'critical_absence') NOT NULL,
    session_type ENUM('lecture', 'lab') NOT NULL,
    missed_count INT NOT NULL,
    total_sessions INT NOT NULL,
    attendance_percentage DECIMAL(5,2) NOT NULL,
    email_subject TEXT NOT NULL,
    email_body TEXT NOT NULL,
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    email_status ENUM('sent', 'failed', 'pending') NOT NULL DEFAULT 'pending',
    FOREIGN KEY (student_id) REFERENCES user(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    INDEX idx_student_course (student_id, course_id),
    INDEX idx_sent_at (sent_at)
);

-- Student attendance summary cache table (for performance)
CREATE TABLE IF NOT EXISTS student_attendance_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    course_id INT NOT NULL,
    session_type ENUM('lecture', 'lab') NOT NULL,
    total_sessions INT NOT NULL DEFAULT 0,
    attended_sessions INT NOT NULL DEFAULT 0,
    missed_sessions INT NOT NULL DEFAULT 0,
    attendance_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES user(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE(student_id, course_id, session_type),
    INDEX idx_student_course (student_id, course_id)
);
`;

async function createMissingTables() {
  console.log('🔧 Creating missing database tables...');
  
  try {
    const db = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      multipleStatements: true
    });
    
    await db.query(createTablesSQL);
    console.log('✅ Tables created successfully!');
    
    // Verify tables were created
    const [tables] = await db.query('SHOW TABLES');
    console.log('📋 Database now has', tables.length, 'tables');
    
    await db.end();
    
    // Now run the test
    console.log('\n🧪 Testing the system now...');
    
  } catch (error) {
    console.error('❌ Failed to create tables:', error.message);
  }
}

createMissingTables();