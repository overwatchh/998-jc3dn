-- Email Log table to track sent attendance emails and prevent duplicates
CREATE TABLE email_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    study_session_id INT NOT NULL,
    week_number INT NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    error_message TEXT,
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_emaillog_session FOREIGN KEY (study_session_id) REFERENCES study_session(id),
    CONSTRAINT fk_emaillog_student FOREIGN KEY (student_id) REFERENCES user(id),
    INDEX idx_session_week (study_session_id, week_number),
    INDEX idx_sent_at (sent_at),
    INDEX idx_student_email (student_email)
);