# 📧 QR Attendance System - Email Reminder Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [How It Works](#how-it-works)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Configuration](#configuration)
6. [API Reference](#api-reference)
7. [Email Templates](#email-templates)
8. [Deployment Guide](#deployment-guide)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

---

## System Overview

### Purpose
The Email Reminder System is an automated component of the QR Attendance System that monitors student attendance and sends escalating email notifications when students fall below the required attendance threshold (default: 80%).

### Key Features
- 🔄 **Automated daily processing** of attendance data
- 📧 **Three-tier email escalation** system (reminder → warning → critical)
- 🎯 **Smart duplicate prevention** (24-hour cooldown)
- 📊 **Real-time attendance calculation** 
- 🔧 **Course-specific configuration** (thresholds, session counts)
- 📝 **Complete audit trail** of all email communications
- 👥 **Multi-role notifications** (students + lecturers for critical cases)
- 🛡️ **Security and authentication** for admin functions

### Business Benefits
- **Proactive intervention**: Catch attendance issues before they become critical
- **Reduced administrative overhead**: Automated processing reduces manual work
- **Improved student outcomes**: Early warnings help students stay on track
- **Compliance**: Maintain institutional attendance policies automatically
- **Transparency**: Complete audit trail for academic reviews

---

## How It Works

### 1. Data Flow Overview
```
Student QR Scan → Attendance Record → Percentage Calculation → Threshold Check → Email Decision → Send Email → Log Activity
```

### 2. Detailed Process Flow

#### Phase 1: Attendance Data Collection
1. **QR Code Scanning**: Students scan unique QR codes during lectures/labs
2. **Real-time Recording**: System captures:
   - Student ID
   - Course Session ID
   - Timestamp
   - Location coordinates
   - QR code verification
3. **Data Storage**: Records stored in `attendance` table

#### Phase 2: Attendance Calculation
1. **Triggered Events**:
   - New attendance record created
   - Daily automated processing
   - Manual admin trigger
   
2. **Calculation Process**:
   ```typescript
   attendancePercentage = (attendedSessions / totalSessions) × 100
   remainingAllowableMisses = allowableMisses - currentMisses
   isAboveThreshold = attendancePercentage >= threshold
   ```

3. **Per Student Per Course Per Session Type**:
   - Lectures calculated separately from labs
   - Individual thresholds maintained
   - Cache updated in `student_attendance_summary`

#### Phase 3: Email Decision Logic
```typescript
if (attendancePercentage < 80%) {
    emailType = 'critical_absence';
} else if (remainingAllowableMisses === 0) {
    emailType = 'second_absence';
} else if (remainingAllowableMisses <= 1) {
    emailType = 'first_absence';
} else {
    // No email needed
}
```

#### Phase 4: Email Processing
1. **Duplicate Check**: Verify no similar email sent in last 24 hours
2. **Template Selection**: Choose appropriate email template
3. **Personalization**: Populate with student-specific data
4. **Recipient List**: 
   - All emails: Student
   - Critical emails: Student + Lecturer
5. **Send Email**: Via SMTP (nodemailer)
6. **Logging**: Record all details in `email_reminder_logs`

### 3. Automation Schedule
- **Daily Processing**: 8:00 AM (configurable)
- **Trigger Method**: Cron job or scheduled task
- **Endpoint**: `GET /api/cron/attendance-reminders`
- **Authentication**: Bearer token required

---

## Architecture

### System Components

#### 1. Core Services
```
src/services/server/
├── attendanceCalculationService.ts  # Attendance percentage calculations
├── emailService.ts                  # Email template generation & sending
└── attendanceReminderService.ts     # Orchestration & business logic
```

#### 2. API Endpoints
```
src/app/api/
├── admin/attendance/
│   ├── reminders/route.ts          # Manual processing & history
│   └── settings/route.ts           # Configuration management
└── cron/
    └── attendance-reminders/route.ts # Automated daily processing
```

#### 3. Frontend Integration
```
src/hooks/
└── useAttendanceReminders.ts       # React hooks for admin interface
```

### Service Architecture

#### AttendanceCalculationService
- **Purpose**: Calculate attendance percentages and statistics
- **Key Methods**:
  - `calculateAttendanceForStudent()`
  - `getStudentsBelowThreshold()`
  - `updateAttendanceSummaryCache()`
- **Caching**: Uses `student_attendance_summary` for performance

#### EmailService
- **Purpose**: Email template generation and delivery
- **Key Methods**:
  - `sendAttendanceReminder()`
  - `generateEmailTemplate()`
  - `hasRecentEmailBeenSent()`
- **Templates**: Three escalation levels with HTML/text versions

#### AttendanceReminderService
- **Purpose**: Orchestrate the complete reminder process
- **Key Methods**:
  - `processAllReminders()`
  - `processCourseReminders()`
  - `processStudentReminder()`
- **Business Logic**: Handles decision making and coordination

---

## Database Schema

### Core Tables

#### email_reminder_settings
```sql
CREATE TABLE email_reminder_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    lecture_count INT NOT NULL DEFAULT 13,
    lab_count INT NOT NULL DEFAULT 12,
    attendance_threshold DECIMAL(3,2) NOT NULL DEFAULT 0.80,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE(course_id)
);
```

#### email_reminder_logs
```sql
CREATE TABLE email_reminder_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    course_id INT NOT NULL,
    reminder_type ENUM('first_absence', 'second_absence', 'critical_absence') NOT NULL,
    session_type ENUM('lecture', 'lab') NOT NULL,
    missed_count INT NOT NULL,
    total_sessions INT NOT NULL,
    attendance_percentage DECIMAL(5,2) NOT NULL,
    email_subject TEXT NOT NULL,
    email_body TEXT NOT NULL,
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    email_status ENUM('sent', 'failed', 'pending') NOT NULL DEFAULT 'pending',
    FOREIGN KEY (student_id) REFERENCES user(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    INDEX idx_student_course (student_id, course_id),
    INDEX idx_sent_at (sent_at)
);
```

#### student_attendance_summary
```sql
CREATE TABLE student_attendance_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    course_id INT NOT NULL,
    session_type ENUM('lecture', 'lab') NOT NULL,
    total_sessions INT NOT NULL DEFAULT 0,
    attended_sessions INT NOT NULL DEFAULT 0,
    missed_sessions INT NOT NULL DEFAULT 0,
    attendance_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES user(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE(student_id, course_id, session_type),
    INDEX idx_student_course (student_id, course_id)
);
```

### Relationships
- `courses` ↔ `email_reminder_settings` (1:1)
- `user` ↔ `email_reminder_logs` (1:many)
- `courses` ↔ `email_reminder_logs` (1:many)
- `user` ↔ `student_attendance_summary` (1:many)

---

## Configuration

### Environment Variables
```env
# Email Service Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@domain.com

# Security
CRON_SECRET=your-secure-random-secret-key

# Database (existing)
DB_HOST=localhost
DB_USER=root
DB_PASS=your-password
DB_NAME=qr_attendance_app
```

### Course-Specific Settings
```typescript
// Example: Configure course reminder settings
const settings = {
  lectureCount: 13,        // Expected lectures in semester
  labCount: 12,           // Expected labs in semester
  attendanceThreshold: 0.80, // 80% minimum attendance
  emailEnabled: true      // Enable/disable email reminders
};

await attendanceReminderService.updateCourseSettings(courseId, settings);
```

### Email Provider Setup

#### Gmail Configuration
1. Enable 2-Factor Authentication
2. Generate App Password:
   - Google Account → Security → App passwords
   - Generate password for "Mail"
   - Use 16-character password in `SMTP_PASS`

#### Alternative Providers
- **Outlook**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom SMTP**: Any SMTP-compatible service

---

## API Reference

### Authentication
- **Admin Endpoints**: Require valid session token
- **Cron Endpoints**: Require Bearer token authentication

### Endpoints

#### POST /api/admin/attendance/reminders
Process attendance reminders manually.

**Body Parameters:**
```json
{
  "action": "process_all" | "process_course" | "process_student",
  "courseId": number,    // Required for process_course/process_student
  "studentId": string    // Required for process_student
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance reminders processed successfully",
  "data": {
    "totalStudentsProcessed": 10,
    "emailsSent": 3,
    "emailsFailed": 0,
    "studentsSkipped": 7,
    "errors": []
  }
}
```

#### GET /api/admin/attendance/reminders
Retrieve reminder history and statistics.

**Query Parameters:**
- `action`: "history" | "statistics"
- `studentId`: string (optional)
- `courseId`: number (optional)
- `limit`: number (default: 50)

**Response (history):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_name": "John Doe",
      "course_name": "Computer Science",
      "reminder_type": "critical_absence",
      "session_type": "lecture",
      "attendance_percentage": 65.50,
      "email_status": "sent",
      "sent_at": "2025-01-15T08:00:00Z"
    }
  ]
}
```

#### PUT /api/admin/attendance/settings
Update course reminder settings.

**Body:**
```json
{
  "courseId": 123,
  "settings": {
    "lectureCount": 13,
    "labCount": 12,
    "attendanceThreshold": 0.80,
    "emailEnabled": true
  }
}
```

#### GET /api/cron/attendance-reminders
Automated daily processing endpoint.

**Headers:**
```
Authorization: Bearer your-cron-secret
```

**Response:**
```json
{
  "success": true,
  "message": "Daily attendance reminders processed successfully",
  "data": {
    "totalStudentsProcessed": 50,
    "emailsSent": 8,
    "emailsFailed": 0,
    "studentsSkipped": 42,
    "errors": []
  },
  "timestamp": "2025-01-15T08:00:00Z"
}
```

---

## Email Templates

### Template 1: First Reminder
**Trigger**: Student has 1-2 classes remaining to miss
**Recipients**: Student only
**Tone**: Friendly, informative

```html
Subject: Attendance Notice - [Course Name]

Dear [Student Name],

This is a friendly reminder about maintaining the required attendance for your course.

Current Status:
- Course: [Course Name] ([Course Code])
- Session Type: [Lecture/Lab]
- Attended: [X] out of [Y] sessions ([Z]%)
- Remaining Allowable Absences: [N] session(s)

Please ensure you maintain at least 80% attendance to meet course requirements.

Best regards,
Academic Administration
```

### Template 2: Second Warning
**Trigger**: Student has 0 classes remaining to miss
**Recipients**: Student only
**Tone**: Warning, urgent

```html
Subject: Important: Attendance Warning - [Course Name]

Dear [Student Name],

IMPORTANT NOTICE: Your attendance for [Course Name] has dropped to a level that requires immediate attention.

⚠️ CRITICAL: You cannot miss any more [session type] sessions to stay above the 80% threshold!

Current Status:
- Attended: [X] out of [Y] sessions ([Z]%)

Required Actions:
1. Attend all remaining sessions
2. Contact your lecturer if you have valid reasons for previous absences
3. Review the course attendance policy

Please take immediate action to ensure your academic success.

Academic Administration
```

### Template 3: Critical Notice
**Trigger**: Student below 80% threshold
**Recipients**: Student + Lecturer (CC)
**Tone**: Critical, requires immediate action

```html
Subject: Critical: Attendance Below Threshold - [Course Name]

Dear [Student Name],

URGENT NOTICE: Your attendance for [Course Name] has fallen below the required 80% threshold.

Final Attendance Status:
- Course: [Course Name] ([Course Code])
- Session Type: [Lecture/Lab]
- Sessions Attended: [X] out of [Y]
- Final Attendance Rate: [Z]%
- Status: BELOW REQUIRED 80% THRESHOLD

IMMEDIATE ACTIONS REQUIRED:
1. Contact your lecturer immediately
2. Report any attendance discrepancies
3. Provide documentation for medical/emergency absences
4. Schedule meeting with academic advisor

Lecturer Contact:
- Name: [Lecturer Name]
- Email: [Lecturer Email]
(Your lecturer has been copied on this notification)

This attendance deficiency may result in academic consequences.

Academic Administration
```

---

## Deployment Guide

### Prerequisites
- Node.js 18+ environment
- MySQL database
- SMTP email service access
- Cron job capability (for automation)

### Installation Steps

#### 1. Environment Setup
```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your settings
```

#### 2. Database Setup
```bash
# Create database tables
node setup-database.js

# Or manually run SQL
mysql -u username -p database_name < src/lib/server/db_schema/db_create.sql
```

#### 3. Email Configuration
```bash
# Test email connectivity
node test-email.js

# Verify system components
node test-attendance-system.js
```

#### 4. System Testing
```bash
# Create test data (optional)
node create-test-data.js

# Test manual processing
npm run attendance:reminders

# Test API endpoints
curl -H "Authorization: Bearer your-secret" http://localhost:3000/api/cron/attendance-reminders
```

### Production Deployment

#### 1. Automated Daily Processing
**Linux/macOS Cron:**
```bash
# Add to crontab (crontab -e)
0 8 * * * curl -H "Authorization: Bearer YOUR_SECRET" https://yourdomain.com/api/cron/attendance-reminders
```

**Windows Task Scheduler:**
```powershell
schtasks /create /tn "Attendance Reminders" /tr "curl -H \"Authorization: Bearer YOUR_SECRET\" https://yourdomain.com/api/cron/attendance-reminders" /sc daily /st 08:00
```

**GitHub Actions (Alternative):**
```yaml
name: Daily Attendance Reminders
on:
  schedule:
    - cron: '0 8 * * *'
jobs:
  process-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Call Reminder API
        run: curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" https://yourdomain.com/api/cron/attendance-reminders
```

#### 2. Monitoring & Logging
- Monitor `email_reminder_logs` table for failed emails
- Set up alerts for high failure rates
- Review processing statistics daily
- Monitor SMTP quota and limits

#### 3. Security Considerations
- Use strong, unique CRON_SECRET
- Implement rate limiting on API endpoints
- Regular security updates for dependencies
- Monitor for suspicious email activity

---

## Troubleshooting

### Common Issues

#### 1. Emails Not Being Sent

**Symptom**: `emailsSent: 0` in processing results

**Possible Causes:**
- SMTP configuration incorrect
- Students above attendance threshold
- Recent emails already sent (24-hour window)
- Email reminders disabled for course

**Solutions:**
```bash
# Test email connection
node test-email.js

# Check student attendance levels
SELECT * FROM student_attendance_summary WHERE attendance_percentage < 80;

# Check email settings
SELECT * FROM email_reminder_settings WHERE email_enabled = true;

# Check recent email logs
SELECT * FROM email_reminder_logs WHERE sent_at > DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

#### 2. Database Connection Errors

**Symptom**: "Database connection failed"

**Solutions:**
- Verify MySQL is running
- Check database credentials in `.env.local`
- Ensure database and tables exist
- Check network connectivity

#### 3. Authentication Errors

**Symptom**: "401 Unauthorized" on API calls

**Solutions:**
- Verify session token for admin endpoints
- Check CRON_SECRET for automated endpoints
- Ensure user has correct role permissions

#### 4. Email Delivery Issues

**Symptom**: Emails marked as "failed" in logs

**Solutions:**
- Check SMTP server status
- Verify email quotas not exceeded
- Check recipient email addresses are valid
- Review email content for spam triggers

### Debugging Commands

```bash
# Check system status
node test-attendance-system.js

# View recent email logs
node check-sent-emails.js

# Test specific student processing
npm run attendance:test-reminder student-id course-id

# Check database state
node check-database.js
```

### Log Analysis

#### Email Reminder Logs Query
```sql
-- Recent email activity
SELECT 
    u.name as student_name,
    c.name as course_name,
    erl.reminder_type,
    erl.attendance_percentage,
    erl.email_status,
    erl.sent_at
FROM email_reminder_logs erl
JOIN user u ON erl.student_id = u.id
JOIN courses c ON erl.course_id = c.id
ORDER BY erl.sent_at DESC
LIMIT 20;

-- Email failure analysis
SELECT 
    email_status,
    COUNT(*) as count,
    DATE(sent_at) as date
FROM email_reminder_logs
WHERE sent_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY email_status, DATE(sent_at)
ORDER BY date DESC;
```

---

## Maintenance

### Regular Tasks

#### Daily
- Monitor processing results for errors
- Check email delivery success rates
- Review any failed email logs

#### Weekly
- Analyze attendance trends
- Review system performance metrics
- Update course settings if needed

#### Monthly
- Clean old log entries (optional)
- Review and update email templates
- Check system security updates

#### Semester
- Update course session counts
- Review attendance thresholds
- Archive completed course data

### Performance Optimization

#### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_attendance_student_session ON attendance(student_id, session_id);
CREATE INDEX idx_summary_percentage ON student_attendance_summary(attendance_percentage);
CREATE INDEX idx_logs_date_status ON email_reminder_logs(sent_at, email_status);
```

#### Caching Strategy
- `student_attendance_summary` acts as cache for attendance calculations
- Update cache after each attendance record
- Refresh daily during automated processing

#### Email Rate Limiting
- Implement delays between email sends if needed
- Monitor SMTP provider limits
- Consider batching for large institutions

### Backup Strategy

#### Database Backups
```bash
# Backup email logs and settings
mysqldump -u username -p database_name email_reminder_logs email_reminder_settings student_attendance_summary > email_system_backup.sql
```

#### Configuration Backups
- Backup `.env.local` configuration
- Document any custom email templates
- Save cron job configurations

### Upgrading

#### Version Compatibility
- Test email templates with new versions
- Verify database schema migrations
- Check API endpoint compatibility
- Update documentation as needed

---

## Support & Resources

### Documentation Files
- `EMAIL_REMINDER_SYSTEM.md` - Implementation guide
- `TESTING_GUIDE.md` - Complete testing procedures
- `api-test-examples.http` - API testing examples

### Scripts
- `test-email.js` - Email connectivity testing
- `test-attendance-system.js` - System verification
- `setup-database.js` - Database initialization
- `create-test-data.js` - Generate sample data

### Monitoring Queries
```sql
-- Daily email statistics
SELECT 
    DATE(sent_at) as date,
    reminder_type,
    email_status,
    COUNT(*) as count
FROM email_reminder_logs
WHERE sent_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(sent_at), reminder_type, email_status
ORDER BY date DESC;

-- Student attendance summary
SELECT 
    c.name as course,
    sas.session_type,
    AVG(sas.attendance_percentage) as avg_attendance,
    COUNT(CASE WHEN sas.attendance_percentage < 80 THEN 1 END) as below_threshold
FROM student_attendance_summary sas
JOIN courses c ON sas.course_id = c.id
GROUP BY c.id, sas.session_type;
```

---

*This documentation covers the complete Email Reminder System for QR Attendance. For technical support or feature requests, refer to the project repository or contact the development team.*