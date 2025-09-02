-- Sample queries to verify data
-- 1. List all available subjects with information about semester
SELECT 
    s.id AS subject_id,
    s.name AS subject_name,
    s.code AS subject_code,
    s.required_lectures,
    s.required_attendance_thresh,
    s.status,
    sem.id AS semester_id,
    sem.name AS semester_name,
    sem.year AS semester_year
FROM subject s
JOIN semester sem ON s.semester_id = sem.id;

-- 2. List all study_session with all information about study_session of a subject given subject_id
-- This query will return all study sessions (lecture, lab, tutorial) for subject with subject_id = 5 (CSCI935 - Compute vision)
SELECT 
    ss.id AS study_session_id,
    ss.day_of_week,
    ss.start_time,
    ss.end_time,
    ss.type,
    r.building_number,
    r.room_number,
    r.description,
    r.latitude,
    r.longitude
FROM study_session ss
JOIN subject_study_session sss ON ss.id = sss.study_session_id
JOIN room r ON ss.room_id = r.id
WHERE sss.subject_id = 5;

--3. List all students enrolled in a study_session given study_session_id
-- List all students enrolled in lab/tutorial of a subject
-- Needs to be passed in the study_session_id
-- For example, to get students enrolled in CSCI935 lab on Wednesday (study_session_id = 14)
-- There will be no recorded for students enrolled in lecture because when a student joins a  subject,
-- it is mandatory to attend lecture, so no need to record it in student_study_session tables.
SELECT 
    u.id AS student_id,
    u.name AS student_name,
    u.email AS student_email,
    u.image,
    u.createdAt
FROM student_study_session sss
JOIN user u ON sss.student_id = u.id
WHERE sss.study_session_id = 14;

-- 4. List all qr_code for a subject with information about study_session and qr_code given subject_id
-- List all QR codes created for a subject
SELECT 
    qr.id AS qr_code_id,    
    qr.createdAt,
    qr.valid_until,
    qr.valid_radius,
    ss.id AS study_session_id,
    ss.day_of_week,
    ss.start_time,
    ss.end_time,
    ss.type,
    qrss.week_number
FROM qr_code qr
JOIN qr_code_study_session qrss ON qr.id = qrss.qr_code_id
JOIN study_session ss ON qrss.study_session_id = ss.id
JOIN subject_study_session sss ON ss.id = sss.study_session_id
WHERE sss.subject_id = 5;

--5. List all students checked_in a qr_code given the qr_code_id
-- Chose one of qr_code from the previous query, for example, 'QR23456789'
-- This will return all students who checked in using the QR code for the study session
SELECT 
    u.id AS student_id,
    u.name AS student_name,
    u.email AS student_email,
    c.checkin_time,
    c.latitude,
    c.longitude,
    c.verify_distance
FROM checkin c
JOIN qr_code_study_session qrss ON c.qr_code_study_session_id = qrss.id
JOIN qr_code qr ON qrss.qr_code_id = qr.id
JOIN user u ON c.student_id = u.id
WHERE qr.qr_code_id = ?;
