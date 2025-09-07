-- Email Reminder System Database Schema
-- This file contains the database schema for the email reminder system

-- Email reminder logs table to track sent emails and prevent duplicates
CREATE TABLE IF NOT EXISTS email_reminder_logs (
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
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  email_status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
  
  INDEX idx_student_subject (student_id, subject_id),
  INDEX idx_sent_at (sent_at),
  INDEX idx_reminder_type (reminder_type),
  INDEX idx_email_status (email_status),
  
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email reminder settings table for configuring thresholds per course
CREATE TABLE IF NOT EXISTS email_reminder_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  lecture_count INT DEFAULT 13,
  lab_count INT DEFAULT 12,
  attendance_threshold DECIMAL(3,2) DEFAULT 0.80,
  email_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_subject (subject_id),
  FOREIGN KEY (subject_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student attendance summary cache table for performance
CREATE TABLE IF NOT EXISTS student_attendance_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  subject_id INT NOT NULL,
  session_type ENUM('lecture', 'lab') NOT NULL,
  total_sessions INT NOT NULL,
  attended_sessions INT NOT NULL,
  missed_sessions INT NOT NULL,
  attendance_percentage DECIMAL(5,2) NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_student_subject_session (student_id, subject_id, session_type),
  INDEX idx_attendance_percentage (attendance_percentage),
  INDEX idx_last_updated (last_updated),
  
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;