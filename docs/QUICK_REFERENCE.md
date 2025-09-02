# 📧 Email Reminder System - Quick Reference

## 🚀 Quick Start Commands

### Test the System
```bash
# Test email connection
node test-email.js

# Test full system
node test-attendance-system.js

# Check sent emails
node check-sent-emails.js
```

### Manual Processing
```bash
# Process all reminders
npm run attendance:reminders

# Test specific student
npm run attendance:test-reminder student-id course-id
```

### Start Development Server
```bash
npm run dev
```

## 🔗 API Endpoints Quick Reference

### Automated Processing (Cron Job)
```bash
curl -H "Authorization: Bearer test-secret-key-123" http://localhost:3000/api/cron/attendance-reminders
```

### Admin API (requires login session)
```bash
# Get email history
GET /api/admin/attendance/reminders?action=history&limit=10

# Get statistics  
GET /api/admin/attendance/reminders?action=statistics

# Process all reminders
POST /api/admin/attendance/reminders
{"action": "process_all"}

# Enable emails for course
POST /api/admin/attendance/settings
{"courseId": 1, "action": "enable"}
```

## 📊 Database Quick Queries

### Check Recent Emails
```sql
SELECT u.name, c.name as course, erl.reminder_type, erl.attendance_percentage, erl.sent_at 
FROM email_reminder_logs erl
JOIN user u ON erl.student_id = u.id 
JOIN courses c ON erl.course_id = c.id 
ORDER BY sent_at DESC LIMIT 10;
```

### Check Students Below Threshold
```sql
SELECT u.name, c.name as course, sas.session_type, sas.attendance_percentage
FROM student_attendance_summary sas
JOIN user u ON sas.student_id = u.id
JOIN courses c ON sas.course_id = c.id
WHERE sas.attendance_percentage < 80
ORDER BY sas.attendance_percentage;
```

### Check Course Settings
```sql
SELECT c.name, ers.attendance_threshold, ers.email_enabled, ers.lecture_count, ers.lab_count
FROM email_reminder_settings ers
JOIN courses c ON ers.course_id = c.id;
```

## 📧 Email Template Types

| Type | Trigger | Recipients | Tone |
|------|---------|------------|------|
| **First Reminder** | 1-2 misses left | Student | Friendly |
| **Second Warning** | 0 misses left | Student | Warning |
| **Critical Notice** | Below 80% | Student + Lecturer | Critical |

## 🔧 Environment Variables Checklist

```env
# Email (Required)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-test-email@ethereal.email
SMTP_PASS=your-password
SMTP_FROM_EMAIL=your-test-email@ethereal.email

# Security (Required)
CRON_SECRET=your-secret-key

# Database (Already configured)
DB_HOST=localhost
DB_USER=root
DB_PASS=your-password
DB_NAME=qr_attendance_app
```

## 🐛 Common Issues & Quick Fixes

### No Emails Sent
- Check if students actually below 80% threshold
- Verify recent emails not sent (24hr window)
- Test email connection: `node test-email.js`

### Database Errors
- Verify MySQL running
- Check credentials in `.env.local`
- Run: `node check-database.js`

### API 401 Errors
- Admin endpoints need session token
- Cron endpoint needs Bearer token
- Check authentication headers

## 📈 Processing Results Meaning

```json
{
  "totalStudentsProcessed": 10,  // Students checked
  "emailsSent": 3,               // New emails sent
  "emailsFailed": 0,             // Failed to send
  "studentsSkipped": 7,          // Already contacted recently
  "errors": []                   // Any error messages
}
```

## 🎯 Success Indicators

✅ **System Working When:**
- `test-email.js` sends test email successfully
- `npm run attendance:reminders` shows processing results
- Emails appear in Ethereal inbox: https://ethereal.email/messages
- Database has entries in `email_reminder_logs` table

## 📅 Daily Cron Job Setup

### Linux/Mac
```bash
# Add to crontab: crontab -e
0 8 * * * curl -H "Authorization: Bearer your-secret" https://yourdomain.com/api/cron/attendance-reminders
```

### Windows
```batch
# Task Scheduler command
curl -H "Authorization: Bearer your-secret" https://yourdomain.com/api/cron/attendance-reminders
```

## 🔍 View Test Emails

1. **Go to**: https://ethereal.email/messages
2. **Search for**: vknsmx3cuesasvo6@ethereal.email (or your test email)
3. **Click emails** to view professional HTML templates

## 📞 Quick Support

- **Documentation**: `docs/EMAIL_REMINDER_SYSTEM_DOCUMENTATION.md`
- **Testing Guide**: `TESTING_GUIDE.md`
- **API Examples**: `api-test-examples.http`
- **Test Scripts**: `test-*.js` files in project root