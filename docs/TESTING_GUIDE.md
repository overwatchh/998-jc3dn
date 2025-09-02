# 🧪 Step-by-Step Testing Guide for Email Reminder System

## Pre-requisites Checklist
- [ ] MySQL database is running
- [ ] Next.js development server can start (`npm run dev`)
- [ ] You have a Gmail account with App Password configured

## Step 1: Configure Email (Required)

### 1.1 Setup Gmail App Password
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Search for "App passwords"
4. Generate app password for "Mail"
5. Copy the 16-character password (format: abcd-efgh-ijkl-mnop)

### 1.2 Update Environment Variables
Edit `.env.local` and replace with your real credentials:
```env
SMTP_USER=your-real-email@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM_EMAIL=your-real-email@gmail.com
```

## Step 2: Basic System Tests

### 2.1 Test Database Connection
```bash
node test-attendance-system.js
```
**Expected Output:**
```
✅ Database connection successful
✅ All required tables exist
Found X active courses
Found Y student enrollments
✅ Email service ready
🎉 All systems ready for testing!
```

### 2.2 Test Email Service
```bash
node test-email.js
```
**Expected Output:**
```
✅ Email service connection successful!
✅ Test email sent successfully!
```
**Check:** You should receive a test email in your inbox.

## Step 3: Create Test Data (if needed)

### 3.1 Check if you have data
```sql
-- Run in your MySQL client
SELECT COUNT(*) as active_courses FROM courses WHERE status = 'active';
SELECT COUNT(*) as enrollments FROM enrollments;
SELECT COUNT(*) as students FROM user WHERE role = 'student';
```

### 3.2 If no data exists, run:
```bash
mysql -u root -p qr_attendance_app < create-test-data.sql
```

## Step 4: Test the Email Reminder System

### 4.1 Start the Development Server
```bash
npm run dev
```
Keep this running in one terminal.

### 4.2 Test Manual Processing (New Terminal)
```bash
# Test all reminders
npm run attendance:reminders
```

**Expected Output:**
```
🚀 Starting attendance reminder processing...
✅ Email service connection successful
📊 Processing attendance reminders...
📈 Processing Results:
   Students Processed: X
   Emails Sent: Y
   Emails Failed: 0
   Students Skipped: Z
✅ Attendance reminder processing completed successfully!
```

### 4.3 Test Automated Cron Endpoint
```bash
curl -H "Authorization: Bearer test-secret-key-123" http://localhost:3000/api/cron/attendance-reminders
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Daily attendance reminders processed successfully",
  "data": {
    "totalStudentsProcessed": 2,
    "emailsSent": 1,
    "emailsFailed": 0,
    "studentsSkipped": 1,
    "errors": []
  }
}
```

## Step 5: Verify Results

### 5.1 Check Email Logs in Database
```sql
SELECT 
  student_id,
  reminder_type,
  session_type,
  attendance_percentage,
  email_status,
  sent_at
FROM email_reminder_logs 
ORDER BY sent_at DESC 
LIMIT 10;
```

### 5.2 Check Your Email Inbox
Look for emails with subjects:
- "Attendance Notice - [Course Name]" (First reminder)
- "Important: Attendance Warning - [Course Name]" (Second warning)
- "Critical: Attendance Below Threshold - [Course Name]" (Critical notice)

### 5.3 Verify Email Content
Check that emails contain:
- Student name
- Course information
- Attendance statistics
- Appropriate messaging for reminder type

## Step 6: Test API Endpoints (Advanced)

### 6.1 First, get admin session (login as admin in browser)
1. Go to `http://localhost:3000`
2. Login with admin credentials
3. Open browser dev tools → Application → Cookies
4. Copy `better-auth.session_token` value

### 6.2 Test Admin API (replace SESSION_TOKEN)
```bash
# Get email history
curl -X GET \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
  "http://localhost:3000/api/admin/attendance/reminders?action=history&limit=5"

# Get statistics
curl -X GET \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
  "http://localhost:3000/api/admin/attendance/reminders?action=statistics"

# Process specific course
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
  -d '{"action": "process_course", "courseId": 1}' \
  "http://localhost:3000/api/admin/attendance/reminders"
```

## Troubleshooting Common Issues

### ❌ "Email service test failed: Invalid login"
**Solution:** 
- Use App Password, not regular Gmail password
- Enable 2-factor authentication first
- Check SMTP_USER and SMTP_PASS in .env.local

### ❌ "No students processed" or "All students skipped"
**Possible causes:**
- Students' attendance is above 80% threshold
- Recent emails already sent (24-hour window)
- No students enrolled in active courses
- Email reminders disabled for course

**Check:**
```sql
-- Check attendance data
SELECT * FROM student_attendance_summary WHERE attendance_percentage < 80;

-- Check email settings
SELECT * FROM email_reminder_settings WHERE email_enabled = true;

-- Check recent emails
SELECT * FROM email_reminder_logs WHERE sent_at > DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

### ❌ "Database connection failed"
**Solution:**
- Verify MySQL is running
- Check DB credentials in .env.local
- Ensure database exists

### ❌ "401 Unauthorized" on admin endpoints
**Solution:**
- Login as admin user in browser first
- Copy session token from cookies
- Use correct session token in requests

## Success Indicators

✅ **System is working correctly when:**
1. `node test-email.js` sends you a test email
2. `npm run attendance:reminders` shows "Processing Results" with numbers
3. You receive attendance reminder emails in your inbox
4. `email_reminder_logs` table shows new entries with `email_status = 'sent'`
5. API endpoints return successful responses with data

## What to Test Next

Once basic testing works:
1. **Create students with different attendance levels** to test all 3 email types
2. **Set up daily cron job** for automated processing
3. **Test frontend React hooks** with admin interface
4. **Configure course-specific settings** (lecture/lab counts, thresholds)
5. **Test duplicate prevention** (try running twice within 24 hours)

---

## Quick Test Commands Summary

```bash
# 1. Test email connection
node test-email.js

# 2. Test full system
node test-attendance-system.js

# 3. Start server
npm run dev

# 4. Test reminder processing
npm run attendance:reminders

# 5. Test cron endpoint
curl -H "Authorization: Bearer test-secret-key-123" http://localhost:3000/api/cron/attendance-reminders
```

Follow these steps in order, and let me know at which step you encounter issues!