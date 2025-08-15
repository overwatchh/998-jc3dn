-- Create database
CREATE DATABASE IF NOT EXISTS qr_attendance_app;
USE qr_attendance_app;

-- tables for better-auth



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

















CREATE TABLE `user` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` TEXT NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `emailVerified` BOOLEAN NOT NULL,
  `image` TEXT,
  `username` VARCHAR(36) NOT NULL,
  `password` VARCHAR(36) NOT NULL,
  `day_of_week` ENUM('Lecturer', 'Student', 'Admin') NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `role` TEXT
);

-- Semester definitions
CREATE TABLE semester (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('autumn', 'spring', 'summer', 'annual') NOT NULL,
    year YEAR NOT NULL,
    UNIQUE(name, year)
);

-- Subject details (these are the individual subjects that students enrol into)
CREATE TABLE subject (
    id INT PRIMARY KEY,
    code VARCHAR(36) NOT NULL,
    name VARCHAR(36) NOT NULL,
    attendance_thresh INT NOT NULL,
    semester_id INT NOT NULL,
    FOREIGN KEY (semester_id) REFERENCES semester(id),
);

-- Subject enrolment -- details of students enrolling in subjects, shows which subject they are associated with,
-- also shows which labs they are enrolled in
CREATE TABLE subject_enrolment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    subject_id INT NOT NULL,
    tutorial_enrolment_id INT, -- which tutorial, if any, they are enrolled in
    FOREIGN KEY (student_id) REFERENCES `user` (`id`),
    FOREIGN KEY (subject_id) REFERENCES subject(id),
    FOREIGN KEY (tutorial_enrolment_id) REFERENCES class(id),
    UNIQUE (student_id, subject_id)
);

--study session the actual subject session the users enrol into, consists of multiple subjects that attend the same lectures
--all lectures tutorials and labs are for this study_session
CREATE TABLE study_session (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(36) NOT NULL,
    coordinator_id VARCHAR(36),
    FOREIGN KEY (coordinator_id) REFERENCES `user`(id)
);


--session enrolment, contains the details of which study_sessions each subject is part of
--more than one subject can be enroled in each study session
CREATE TABLE session_enrolment (
    enrolment_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    study_session_id INT NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subject(id),
    FOREIGN KEY (study_session_id) REFERENCES study_session(id),
    UNIQUE (subject_id, study_session_id)
);


-- class -- locations are the default locations, copies of these information are in the event table, and can be updated for individual events by admins
CREATE TABLE class (
    id INT AUTO_INCREMENT PRIMARY KEY,
    study_session_id INT NOT NULL,
    enrollable BOOLEAN NOT NULL,
    type ENUM('Lecture', 'Lab', 'Tutorial') NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_classes INT NOT NULL,
    room_id INT NOT NULL,
    teacher_id INT NOT NULL,
    FOREIGN KEY (study_session_id) REFERENCES study_session(id),
    FOREIGN KEY (teacher_id) REFERENCES `user`(id),
    FOREIGN KEY (room_id) REFERENCES room(id)
);

-- each individual event or istance of a class element (lecture, lab, tutorial) being taughts, e.g. one for each week
CREATE TABLE event (
  token VARCHAR(128) PRIMARY KEY,
  class_id INT NOT NULL,
  created_at
--series number, most events are one in a sequence for a class (e.g. weekly lectures), each gets their own number within that series
  series INT NOT NULL,
  valid_until
  valid_radius
  date
  FOREIGN KEY (class_id) REFERENCES class(id)
  
);

--checkin



-- room


--campus









