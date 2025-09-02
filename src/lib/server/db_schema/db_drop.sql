-- Use the correct database
USE qr_attendance_app;

-- Disable foreign key checks to avoid dependency issues
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables 
DROP TABLE IF EXISTS checkin;
DROP TABLE IF EXISTS qr_code_study_session;
DROP TABLE IF EXISTS validity;
DROP TABLE IF EXISTS qr_code;
DROP TABLE IF EXISTS lecturer_study_session;
DROP TABLE IF EXISTS student_study_session;
DROP TABLE IF EXISTS subject_study_session;
DROP TABLE IF EXISTS study_session;
DROP TABLE IF EXISTS enrolment;
DROP TABLE IF EXISTS subject;
DROP TABLE IF EXISTS semester;
DROP TABLE IF EXISTS room;
DROP TABLE IF EXISTS campus;
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS `session`;
DROP TABLE IF EXISTS verification;
DROP TABLE IF EXISTS `user`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;