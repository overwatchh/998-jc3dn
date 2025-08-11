-- Use the correct database
USE qr_attendance_app;

-- Drop child tables first (due to foreign key dependencies)
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS session_qr_codes;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS course_sessions;
DROP TABLE IF EXISTS course_lecturers;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS semesters;
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS `session`;
DROP TABLE IF EXISTS verification;
DROP TABLE IF EXISTS `user`;
