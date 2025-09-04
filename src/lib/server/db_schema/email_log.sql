-- Email log table for tracking sent reminders
CREATE TABLE IF NOT EXISTS email_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    email_type ENUM('partial_attendance_reminder', 'weekly_summary', 'final_call') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('sent', 'failed', 'pending') NOT NULL DEFAULT 'pending',
    error_message TEXT,
    CONSTRAINT fk_email_log_student FOREIGN KEY (student_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_student_sent_at (student_id, sent_at),
    INDEX idx_email_type (email_type),
    INDEX idx_sent_at (sent_at)
);

-- Prevent duplicate emails within same day for same student+type
-- ALTER TABLE email_log ADD CONSTRAINT unique_daily_email 
-- UNIQUE (student_id, email_type, DATE(sent_at));