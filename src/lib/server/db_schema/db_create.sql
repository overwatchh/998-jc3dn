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

-- Semester definitions
CREATE TABLE semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('autumn', 'spring', 'summer') NOT NULL,
    year YEAR NOT NULL,
    UNIQUE(name, year)
);

-- Courses linked to semester
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    semester_id INT NOT NULL,
    status ENUM('active', 'finished') NOT NULL,
    FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

-- Assign lecturer(s) to course
CREATE TABLE course_lecturers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    lecturer_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (lecturer_id) REFERENCES `user` (`id`),
    UNIQUE(course_id, lecturer_id)
);

-- Physical location for sessions
CREATE TABLE locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    building_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    description VARCHAR(240) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    CONSTRAINT unique_building_room UNIQUE (building_name, room_number, description)
);

-- Weekly recurring sessions (lecture or lab)
CREATE TABLE course_sessions (
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
CREATE TABLE enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    course_id INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES `user` (`id`),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE (student_id, course_id)
);

-- Generated QR codes per session instance
CREATE TABLE session_qr_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_session_id INT NOT NULL,
    qr_code VARCHAR(12) NOT NULL, -- store as encoded text
    generated_at DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,
    week_number INT NOT NULL,    
    radius INT NOT NULL DEFAULT 100,
    FOREIGN KEY (course_session_id) REFERENCES course_sessions(id),
    CONSTRAINT unique_qr_code UNIQUE (qr_code),
    CONSTRAINT unique_session_week UNIQUE (course_session_id, week_number)
);

-- Student attendance logs
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    session_id INT NOT NULL,
    qr_code_id INT,
    checkin_time DATETIME NOT NULL,    
    -- optional if QR scan should be traceable
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    verify_distance BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (student_id) REFERENCES `user` (`id`),
    FOREIGN KEY (session_id) REFERENCES course_sessions(id),
    FOREIGN KEY (qr_code_id) REFERENCES session_qr_codes(id)    
);









-- Subject enrolment -- details of students enrolling in subjects, shows which subject they are associated with,
-- also shows which labs they are enrolled in

CREATE TABLE subject_enrolment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    subject_id INT NOT NULL,
    tutorial_enrolment VARCHAR(36),
    FOREIGN KEY (student_id) REFERENCES `user` (`id`),
    FOREIGN KEY (subject_id) REFERENCES subject(id),
    UNIQUE (student_id, subject_id)
);

-- subject

