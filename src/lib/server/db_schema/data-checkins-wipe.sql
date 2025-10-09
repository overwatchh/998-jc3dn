USE qr_attendance_app;

START TRANSACTION;
SET FOREIGN_KEY_CHECKS = 0;


-- Attendance graph (deepest children first)
DELETE FROM checkin;
DELETE FROM qr_code_study_session;
DELETE FROM validity;
DELETE FROM qr_code;

-- (Optional) reset auto-increment counters
ALTER TABLE checkin               AUTO_INCREMENT = 1;
ALTER TABLE qr_code               AUTO_INCREMENT = 1;
ALTER TABLE validity              AUTO_INCREMENT = 1;
ALTER TABLE qr_code_study_session AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
