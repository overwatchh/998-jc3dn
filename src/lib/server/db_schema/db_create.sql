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
  `type` ENUM('Lecturer', 'Student', 'Admin') NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `role` TEXT
);

--carried from previous version
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

CREATE TABLE `verification` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `identifier` TEXT NOT NULL,
  `value` TEXT NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
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


--campus
CREATE TABLE campus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campus_name VARCHAR(36) NOT NULL
);

-- room
CREATE TABLE room (
  id INT AUTO_INCREMENT PRIMARY KEY,
  building_number INT NOT NULL,
  building_name VARCHAR(36) NOT NULL,
  room_number INT NOT NULL,
  campus_id INT NOT NULL,
  description VARCHAR(128),
  latitude DECIMAL(9, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  room_size INT NOT NULL,
  FOREIGN KEY (campus_id) REFERENCES campus(id)  
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



-- each individual event or istance of a class element (lecture, lab, tutorial) being taughts, e.g. one for each week
CREATE TABLE event (
  token VARCHAR(128) PRIMARY KEY, -- encoded text used as unique ID and random number for QR code address
  class_id INT NOT NULL,
  created_at DATETIME NOT NULL,
--series number, most events are one in a sequence for a class (e.g. weekly lectures), each gets their own number within that series
  series INT NOT NULL,
  valid_until DATETIME NOT NULL,
  valid_radius INT NOT NULL DEFAULT 50,
  room_id INT NOT NULL,
  date DATE NOT NULL,
  FOREIGN KEY (class_id) REFERENCES class(id),
  FOREIGN KEY (room_id) REFERENCES room(id)
);



--checkin -- attendance log
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    checkin_time DATETIME NOT NULL,
    event_token VARCHAR(128) NOT NULL,
    week INT NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    offline_student BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (student_id) REFERENCES `user` (`id`),
    FOREIGN KEY (event_token) REFERENCES event(token)
);



