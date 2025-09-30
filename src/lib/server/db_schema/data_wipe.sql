-- wipe-all-data-delete.sql
USE qr_attendance_app;

START TRANSACTION;
SET FOREIGN_KEY_CHECKS = 0;

-- Email-related (depend on subject, study_session, user)
DELETE FROM email_log;
DELETE FROM email_reminder_logs;
DELETE FROM email_reminder_settings;

-- Attendance graph (deepest children first)
DELETE FROM checkin;
DELETE FROM qr_code_study_session;
DELETE FROM validity;
DELETE FROM qr_code;

-- Session mappings
DELETE FROM lecturer_study_session;
DELETE FROM student_study_session;
DELETE FROM subject_study_session;

-- Timetable & enrolments
DELETE FROM study_session;
DELETE FROM enrolment;

-- Curriculum
DELETE FROM subject;
DELETE FROM semester;

-- Locations
DELETE FROM room;
DELETE FROM campus;

-- BetterAuth tables
DELETE FROM account;
DELETE FROM `session`;
DELETE FROM verification;
DELETE FROM `user`;

-- (Optional) reset auto-increment counters
ALTER TABLE campus                AUTO_INCREMENT = 1;
ALTER TABLE room                  AUTO_INCREMENT = 1;
ALTER TABLE semester              AUTO_INCREMENT = 1;
ALTER TABLE subject               AUTO_INCREMENT = 1;
ALTER TABLE study_session         AUTO_INCREMENT = 1;
ALTER TABLE qr_code               AUTO_INCREMENT = 1;
ALTER TABLE validity              AUTO_INCREMENT = 1;
ALTER TABLE qr_code_study_session AUTO_INCREMENT = 1;
ALTER TABLE email_log             AUTO_INCREMENT = 1;
ALTER TABLE email_reminder_logs   AUTO_INCREMENT = 1;
ALTER TABLE email_reminder_settings AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
