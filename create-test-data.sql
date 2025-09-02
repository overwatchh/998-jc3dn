-- Create test data for attendance reminder system
-- Run these SQL commands in your MySQL database

-- Create a test semester
INSERT INTO semesters (name, year) VALUES ('spring', 2025) ON DUPLICATE KEY UPDATE year=year;

-- Create a test course
INSERT INTO courses (name, code, semester_id, status) 
VALUES ('Computer Science Fundamentals', 'CS101', 1, 'active')
ON DUPLICATE KEY UPDATE status='active';

-- Create course sessions (lectures and labs)
INSERT INTO course_sessions (course_id, type, day_of_week, start_time, end_time) VALUES
(1, 'lecture', 'Monday', '09:00:00', '11:00:00'),
(1, 'lecture', 'Wednesday', '09:00:00', '11:00:00'),
(1, 'lab', 'Friday', '14:00:00', '16:00:00');

-- Create test users (students)
INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt, role) VALUES
('test-student-1', 'John Doe', 'john.doe@example.com', true, NOW(), NOW(), 'student'),
('test-student-2', 'Jane Smith', 'jane.smith@example.com', true, NOW(), NOW(), 'student'),
('test-lecturer-1', 'Dr. Professor', 'professor@example.com', true, NOW(), NOW(), 'lecturer')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Enroll students in course
INSERT INTO enrollments (student_id, course_id) VALUES
('test-student-1', 1),
('test-student-2', 1)
ON DUPLICATE KEY UPDATE course_id=course_id;

-- Assign lecturer to course
INSERT INTO course_lecturers (course_id, lecturer_id) VALUES
(1, 'test-lecturer-1')
ON DUPLICATE KEY UPDATE lecturer_id=lecturer_id;

-- Create some attendance records (simulating missed classes)
-- This will make students appear below threshold

-- Enable email reminders for the course
INSERT INTO email_reminder_settings (course_id, lecture_count, lab_count, attendance_threshold, email_enabled) 
VALUES (1, 13, 12, 0.80, true)
ON DUPLICATE KEY UPDATE email_enabled=true;

-- Check the data
SELECT 'Courses:' as Info;
SELECT id, name, code, status FROM courses;

SELECT 'Students:' as Info;
SELECT u.name, u.email, u.role FROM user u WHERE u.role = 'student';

SELECT 'Enrollments:' as Info;
SELECT u.name as student_name, c.name as course_name 
FROM enrollments e 
JOIN user u ON e.student_id = u.id 
JOIN courses c ON e.course_id = c.id;