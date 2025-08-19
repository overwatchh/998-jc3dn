-- Use the correct database
USE qr_attendance_app;

-- Drop child tables first (due to foreign key dependencies)
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS event;
DROP TABLE IF EXISTS class;
DROP TABLE IF EXISTS room;
DROP TABLE IF EXISTS campus;
DROP TABLE IF EXISTS session_enrolment;
DROP TABLE IF EXISTS study_session;
DROP TABLE IF EXISTS subject_enrolment;
DROP TABLE IF EXISTS subject;
DROP TABLE IF EXISTS semester;
DROP TABLE IF EXISTS `verification`;
DROP TABLE IF EXISTS `session`;
DROP TABLE IF EXISTS `account`;
DROP TABLE IF EXISTS `user;
