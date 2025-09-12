# 📧 Automatic Attendance Email System Setup

This system automatically sends attendance reminder emails to students after each lecture ends. Students receive detailed information about their attendance for that specific lecture and their overall attendance status.

## 🚀 Quick Setup

### 1. Gmail SMTP Configuration

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Update `.env.local`** with your Gmail credentials:
```env
# Update these with your actual Gmail credentials
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Your Institution Name - Attendance System

# Enable automatic emails
AUTO_EMAIL_ENABLED=true
EMAIL_CHECK_INTERVAL=5
```

### 2. Database Setup

Run this SQL to create the email log table:
```bash
mysql -u root -p qr_attendance_app < src/lib/server/db_schema/email_log_table.sql
```

### 3. Start the System

```bash
npm run dev
```

The automatic email system will start immediately and check for expired lectures every 5 minutes.

## 📋 How It Works

### Email Trigger Logic
1. **Automatic Detection**: Every 5 minutes, the system checks for lectures that just ended
2. **Attendance Calculation**: Calculates each student's attendance for that lecture:
   - 2 QR scans = 90% attendance
   - 1 QR scan = 45% attendance  
   - 0 QR scans = 0% attendance
3. **Overall Statistics**: Calculates total semester attendance and remaining classes they can miss
4. **Email Delivery**: Sends personalized emails to all enrolled students

### Email Content
Each email contains:
- **Lecture Summary**: Subject, week number, attendance status
- **Current Lecture**: Number of check-ins (0, 1, or 2)
- **Overall Attendance**: Total percentage and status
- **Classes Remaining**: How many more classes they can miss and still pass (80% requirement)
- **Warning**: If attendance is below 80%, shows warning message
- **Visual Design**: Professional HTML email with proper styling

## 🛠️ System Features

### Automatic Operation
- ✅ **No Manual Intervention**: Completely automatic after setup
- ✅ **Duplicate Prevention**: Won't send duplicate emails for the same lecture
- ✅ **Error Handling**: Logs failed emails and continues processing
- ✅ **Rate Limiting**: Delays between emails to prevent SMTP issues
- ✅ **Server Restart Safe**: Automatically resumes after server restarts

### Reliability Features
- 📊 **Email Logging**: Tracks all sent emails in database
- 🔄 **Retry Logic**: Built-in error handling and retry mechanisms  
- ⏰ **Timing Control**: Configurable check intervals
- 🚫 **Spam Prevention**: Prevents duplicate emails within 2 hours

## ⚙️ Configuration Options

### Environment Variables
```env
# Required for Gmail
SMTP_HOST=smtp.gmail.com           # SMTP server
SMTP_PORT=587                      # TLS port (587) or SSL port (465)
SMTP_USER=your-email@gmail.com     # Your Gmail address
SMTP_PASS=app-password             # Gmail app password
FROM_EMAIL=your-email@gmail.com    # From address
FROM_NAME=Attendance System        # Display name

# System Settings
AUTO_EMAIL_ENABLED=true            # Enable/disable automatic emails
EMAIL_CHECK_INTERVAL=5             # Check every N minutes (default: 5)
SYSTEM_EMAIL_KEY=your-secret-key   # Security key for API access
```

### Timing Configuration
- **Check Interval**: How often to scan for expired lectures (default: 5 minutes)
- **Lookback Window**: Processes lectures that expired in the last N+1 minutes
- **Duplicate Prevention**: 2-hour window to prevent duplicate emails

## 📊 Monitoring & Logs

### Server Logs
The system logs all activities:
```
🚀 Automatic attendance email scheduler initialized and started
Found 3 expired lecture sessions to process
Processing CS101 - Week 5
Session 12 completed: 25 sent, 0 failed
```

### Database Tracking
Check the `email_log` table:
```sql
SELECT 
    study_session_id,
    week_number,
    COUNT(*) as emails_sent,
    SUM(success) as successful,
    SUM(!success) as failed,
    MAX(sent_at) as last_sent
FROM email_log 
GROUP BY study_session_id, week_number
ORDER BY last_sent DESC;
```

## 🔧 API Endpoints

### Manual Trigger (For Testing)
```http
POST /api/lecturer/send-attendance-emails
Content-Type: application/json

{
  "study_session_id": 1,
  "week_number": 5,
  "smtp_config": {
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_user": "your-email@gmail.com",
    "smtp_pass": "your-app-password",
    "from_email": "your-email@gmail.com",
    "from_name": "Attendance System"
  }
}
```

### System Status
```http
GET /api/system/init
```

## 🚨 Troubleshooting

### Common Issues

**1. Emails Not Sending**
- Check Gmail app password is correct
- Verify `AUTO_EMAIL_ENABLED=true`
- Check server logs for SMTP errors

**2. Duplicate Emails**
- System prevents duplicates within 2 hours
- Check `email_log` table for recent entries

**3. Missing Emails**
- Verify lecture has ended (QR validity expired)
- Check if students are enrolled in the subject
- Confirm SMTP configuration is correct

**4. SMTP Authentication Failed**
- Regenerate Gmail app password
- Ensure 2FA is enabled on Gmail
- Check username/password in .env.local

### Testing Setup
1. Create a test lecture with short validity period (5 minutes)
2. Have students scan QR codes
3. Wait for validity to expire
4. Check server logs and student emails within 5-10 minutes

## 📧 Email Examples

### Good Attendance Email
- Subject: "📊 Attendance Update: CS101 - Week 5"
- Content: Shows 90% for lecture, 85% overall, can miss 2 more classes

### Low Attendance Warning
- Subject: "📊 Attendance Update: CS101 - Week 5 ⚠️ Action Required"
- Content: Shows partial attendance, below 80%, warning message with action needed

## 💡 Best Practices

1. **Test First**: Set up with a test email before using with students
2. **Monitor Logs**: Check server logs regularly for any issues  
3. **Backup Config**: Keep your SMTP credentials secure and backed up
4. **Student Communication**: Inform students about the automatic email system
5. **Regular Maintenance**: Monitor the `email_log` table for delivery issues

## 🔒 Security Notes

- Gmail app passwords are more secure than regular passwords
- The `SYSTEM_EMAIL_KEY` prevents unauthorized API access
- Email credentials are stored in environment variables (not in code)
- System only sends emails to enrolled students

---

For support or issues, check the server logs first, then verify your Gmail SMTP configuration.