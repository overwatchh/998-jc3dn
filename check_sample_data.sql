-- Check what sample data exists in the database
USE qr_attendance_app;

-- Check users
SELECT 'USERS' as table_name, COUNT(*) as count FROM user;
SELECT id, name, email, role FROM user LIMIT 10;

-- Check subjects
SELECT 'SUBJECTS' as table_name, COUNT(*) as count FROM subject;
SELECT id, name, code FROM subject LIMIT 5;

-- Check study sessions
SELECT 'STUDY_SESSIONS' as table_name, COUNT(*) as count FROM study_session;
SELECT id, day_of_week, start_time, end_time, type FROM study_session LIMIT 5;

-- Check QR codes
SELECT 'QR_CODES' as table_name, COUNT(*) as count FROM qr_code;
SELECT id, createdAt, valid_radius FROM qr_code LIMIT 5;

-- Check your specific account
SELECT 'YOUR_ACCOUNT' as info, id, name, email, role FROM user WHERE email = 'dks695@uowmail.edu.au';