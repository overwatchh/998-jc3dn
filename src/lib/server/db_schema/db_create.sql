-- Create database
CREATE DATABASE IF NOT EXISTS qr_attendance_app;
USE qr_attendance_app;

-- tables for better-auth

CREATE TABLE `user` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` TEXT NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `emailVerified` BOOLEAN NOT NULL,
  `image` TEXT,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `role` TEXT
);

CREATE TABLE `session` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `expiresAt` DATETIME NOT NULL,
  `token` VARCHAR(255) NOT NULL UNIQUE,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `ipAddress` TEXT,
  `userAgent` TEXT,
  `userId` VARCHAR(36) NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
);

CREATE TABLE `account` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `accountId` TEXT NOT NULL,
  `providerId` TEXT NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `accessToken` TEXT,
  `refreshToken` TEXT,
  `idToken` TEXT,
  `accessTokenExpiresAt` DATETIME,
  `refreshTokenExpiresAt` DATETIME,
  `scope` TEXT,
  `password` TEXT,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
);

CREATE TABLE `verification` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `identifier` TEXT NOT NULL,
  `value` TEXT NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

-- Campus table
CREATE TABLE campus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Room table
CREATE TABLE room (
    id INT AUTO_INCREMENT PRIMARY KEY,
    building_number VARCHAR(50) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    description TEXT,
    latitude DECIMAL(18,14),
    longitude DECIMAL(18,14),
    campus_id INT NOT NULL,
    CONSTRAINT fk_room_campus FOREIGN KEY (campus_id) REFERENCES campus(id)
);

-- Semester table
CREATE TABLE semester (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('autumn', 'spring', 'summer') NOT NULL,
    year YEAR NOT NULL,
    UNIQUE(name, year)
);

-- Subject table
CREATE TABLE subject (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    required_lectures INT DEFAULT 12,
    required_attendance_thresh DECIMAL(3,2) DEFAULT 0.80,
    status ENUM('active', 'finished') DEFAULT 'active',
    semester_id INT NOT NULL,
    CONSTRAINT fk_subject_semester FOREIGN KEY (semester_id) REFERENCES semester(id)
);

-- Enrolment table
CREATE TABLE enrolment (
    student_id VARCHAR(36) NOT NULL,
    subject_id INT NOT NULL,
    date DATE DEFAULT (CURRENT_DATE),
    PRIMARY KEY (student_id, subject_id),
    CONSTRAINT fk_enrol_user FOREIGN KEY (student_id) REFERENCES user(id),
    CONSTRAINT fk_enrol_subject FOREIGN KEY (subject_id) REFERENCES `subject`(id)
);

-- Study session table
CREATE TABLE study_session (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type ENUM('lecture', 'tutorial') NOT NULL,
    room_id INT NOT NULL,
    CONSTRAINT fk_studysession_room FOREIGN KEY (room_id) REFERENCES room(id)
);

-- Subject-StudySession mapping
CREATE TABLE subject_study_session (
    subject_id INT NOT NULL,
    study_session_id INT NOT NULL,
    PRIMARY KEY (subject_id, study_session_id),
    CONSTRAINT fk_subsess_subject FOREIGN KEY (subject_id) REFERENCES subject(id),
    CONSTRAINT fk_subsess_session FOREIGN KEY (study_session_id) REFERENCES study_session(id)
);

-- Student-StudySession mapping
CREATE TABLE student_study_session (
    student_id VARCHAR(36) NOT NULL,
    study_session_id INT NOT NULL,
    PRIMARY KEY (student_id, study_session_id),
    CONSTRAINT fk_stusess_student FOREIGN KEY (student_id) REFERENCES user(id),
    CONSTRAINT fk_stusess_session FOREIGN KEY (study_session_id) REFERENCES study_session(id)
);

-- Lecturer-StudySession mapping
CREATE TABLE lecturer_study_session (
    lecturer_id VARCHAR(36) NOT NULL,
    study_session_id INT NOT NULL,
    PRIMARY KEY (lecturer_id, study_session_id),
    CONSTRAINT fk_lectsess_lect FOREIGN KEY (lecturer_id) REFERENCES user(id),
    CONSTRAINT fk_lectsess_session FOREIGN KEY (study_session_id) REFERENCES study_session(id)
);

-- QR Code table
CREATE TABLE qr_code (
    id INT AUTO_INCREMENT PRIMARY KEY,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_radius DECIMAL(10,2) DEFAULT 100.00,
    validate_geo TINYINT(1) DEFAULT 1,
    valid_room_id INT
);

-- Validity table
CREATE TABLE validity(
    id INT AUTO_INCREMENT PRIMARY KEY,
    qr_code_id INT NOT NULL,
    count TINYINT NOT NULL DEFAULT 1,
    start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 30 MINUTE),
    CONSTRAINT fk_validity_qrcode FOREIGN KEY (qr_code_id) REFERENCES qr_code(id),
    UNIQUE (qr_code_id, start_time, end_time)
);

-- Trigger to ensure only 2 validity records per qr_code_id
-- This trigger will prevent inserting more than 2 validity records for the same qr_code_id
DELIMITER //

CREATE TRIGGER validity_max_two
BEFORE INSERT ON validity
FOR EACH ROW
BEGIN
    DECLARE cnt INT;

    SELECT COUNT(*) INTO cnt
    FROM validity
    WHERE qr_code_id = NEW.qr_code_id;

    IF cnt >= 2 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Only 2 records per qr_code_id are allowed';
    END IF;
END //

DELIMITER ;

-- QR Code - Study Session mapping
CREATE TABLE qr_code_study_session (
    id INT AUTO_INCREMENT PRIMARY KEY,
    study_session_id INT NOT NULL,
    qr_code_id INT NOT NULL,
    week_number INT NOT NULL,
    CONSTRAINT fk_qrss_session FOREIGN KEY (study_session_id) REFERENCES study_session(id),
    CONSTRAINT fk_qrss_qrcode FOREIGN KEY (qr_code_id) REFERENCES qr_code(id),
    UNIQUE (study_session_id, week_number) -- Ensure one QR code per study session per week
);

-- Check-in table
CREATE TABLE checkin (
    student_id VARCHAR(36) NOT NULL,
    qr_code_study_session_id INT NOT NULL,
    checkin_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    validity_id INT NOT NULL,
    latitude DECIMAL(18,14),
    longitude DECIMAL(18,14),
    checkin_type ENUM('lecture', 'tutorial') DEFAULT 'lecture',
    PRIMARY KEY (student_id, qr_code_study_session_id, validity_id),
    CONSTRAINT fk_check_validity FOREIGN KEY (validity_id) REFERENCES validity(id),
    CONSTRAINT fk_check_student FOREIGN KEY (student_id) REFERENCES user(id),
    CONSTRAINT fk_check_qrss FOREIGN KEY (qr_code_study_session_id) REFERENCES qr_code_study_session(id)
);

-- Email logging tables for attendance reminder system
-- Simple email log for basic tracking
CREATE TABLE email_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    study_session_id INT,
    week_number INT,
    student_id VARCHAR(36),
    student_email VARCHAR(255) NOT NULL,
    success TINYINT(1) DEFAULT 1,
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_email_log_session FOREIGN KEY (study_session_id) REFERENCES study_session(id),
    INDEX idx_email_log_sent_at (sent_at)
);

-- Detailed email reminder logs with attendance context
CREATE TABLE email_reminder_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    subject_id INT NOT NULL,
    reminder_type ENUM('first_absence', 'second_absence', 'critical_absence') NOT NULL,
    session_type ENUM('lecture', 'lab') NOT NULL,
    missed_count INT NOT NULL,
    total_sessions INT NOT NULL,
    attendance_percentage DECIMAL(5,2) NOT NULL,
    email_subject TEXT NOT NULL,
    email_body TEXT NOT NULL,
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    email_status ENUM('sent', 'failed', 'pending') NOT NULL DEFAULT 'pending',
    CONSTRAINT fk_email_reminder_student FOREIGN KEY (student_id) REFERENCES user(id),
    CONSTRAINT fk_email_reminder_subject FOREIGN KEY (subject_id) REFERENCES subject(id),
    INDEX idx_email_reminder_sent_at (sent_at)
);

-- Global email reminder system settings
CREATE TABLE email_reminder_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lecture_count INT NOT NULL DEFAULT 13,
    lab_count INT NOT NULL DEFAULT 12,
    attendance_threshold DECIMAL(3,2) NOT NULL DEFAULT 0.80,
    email_enabled TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    subject_id INT,
    CONSTRAINT fk_email_settings_subject FOREIGN KEY (subject_id) REFERENCES subject(id)
);
