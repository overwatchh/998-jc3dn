# QR Attendance Email Reminder System

## 📧 System Overview

The QR Attendance Email Reminder System automatically sends attendance notifications to students when lectures end. It tracks multi-week attendance patterns and provides comprehensive attendance analytics.

## 🎯 How It Works

### 1. **Automatic Detection**
- **Scheduler runs every minute** checking for ended lectures
- **Detects when all QR codes have expired** (lecture is complete)
- **Triggers email processing** for completed lectures automatically

### 2. **Multi-Week Attendance Tracking**
- Calculates **current week attendance** (0%, 45%, or 90% based on QR scans)
- Aggregates **historical attendance** across all previous weeks
- Provides **overall attendance percentage** and classes student can miss
- Identifies **at-risk students** with low attendance

### 3. **Email Processing**
- Sends **personalized emails** to all enrolled students
- Includes **current week** and **overall attendance** data
- Logs all email attempts to database for auditing
- Handles failures gracefully with error tracking

## 🔧 Core Components

### **Files Structure**
```
src/
├── lib/server/
│   ├── init.ts                      # Auto-starts scheduler on app launch
│   ├── lecture-end-scheduler.ts     # Automatic lecture detection (cron job)
│   ├── attendance-calculator.ts     # Multi-week attendance calculations
│   └── email.ts                    # Email sending functionality
├── app/api/system/
│   ├── lecture-end-trigger/route.ts # Email trigger API endpoint
│   └── init/route.ts               # System initialization API
└── lib/server/db_schema/
    └── db_create.sql               # Complete database schema with email logs
```

### **Database Tables**

#### Core Tables (Existing)
- `study_session` - Lecture schedules
- `qr_code` - QR codes for attendance
- `validity` - QR code time windows
- `checkin` - Student check-ins
- `user` - Student/lecturer accounts
- `enrolment` - Student-subject enrollment

#### Email Logging Tables (New)
- `email_log` - Basic email tracking
- `email_reminder_logs` - Detailed reminder logs
- `email_reminder_settings` - System configuration

## ⚙️ System Configuration

### **Environment Variables Required**
```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=QR Attendance System

# System Security
SYSTEM_EMAIL_KEY=attendance_email_system_2024
```

### **Automatic Startup**
1. System **automatically initializes** when Next.js app starts
2. **Cron scheduler** begins running every minute
3. **No manual intervention** required

## 🚀 Deployment Steps

### 1. **Database Setup**
```sql
-- Run the complete schema
mysql < src/lib/server/db_schema/db_create.sql
```

### 2. **Environment Configuration**
- Set all required environment variables
- Configure SMTP settings for your email provider
- Set system authentication key

### 3. **Application Start**
```bash
npm run build    # Production build
npm run start    # Start production server
```

The system will automatically:
- Initialize the email scheduler
- Begin monitoring for completed lectures
- Send emails when lectures end

## 📊 System Flow

```
1. Lecture Starts → QR Codes Created
2. Students Check In → Attendance Recorded
3. Lecture Ends → All QR Codes Expire
4. Scheduler Detects → Triggers Email Processing
5. System Calculates → Multi-Week Attendance
6. Emails Sent → To All Enrolled Students
7. Activity Logged → To Database Tables
```

## 🔍 Monitoring & Debugging

### **Email Logs**
```sql
-- Check recent email activity
SELECT * FROM email_log 
WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY sent_at DESC;

-- Check failure rates
SELECT 
    success,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM email_log 
GROUP BY success;
```

### **System Status**
- Check application logs for scheduler activity
- Monitor email delivery rates in `email_log` table
- Verify SMTP configuration if emails fail

## 📧 Email Content

Students receive emails containing:
- **Current week attendance** (Week X: Y% attendance)
- **Overall attendance** across all weeks
- **Classes they can miss** before falling below threshold
- **Warning messages** for at-risk students
- **Subject and week information**

## ⚠️ Important Notes

- **Automatic Operation**: System requires no manual intervention
- **Email Logging**: All attempts are logged for audit purposes
- **Error Handling**: Failures are tracked but don't stop processing
- **SMTP Limits**: Small delays between emails prevent server overload
- **Multi-Week Support**: Handles complex attendance calculations
- **Production Ready**: Includes proper error handling and logging

## 🛠️ API Endpoints

### System Trigger (Internal Use)
```
POST /api/system/lecture-end-trigger
{
  "study_session_id": 101,
  "week_number": 6,
  "system_key": "attendance_email_system_2024"
}
```

### System Initialization
```
GET /api/system/init
```

## 🎯 Success Metrics

- ✅ **100% Automatic Operation** - No manual triggers needed
- ✅ **Multi-Week Tracking** - Complete attendance history
- ✅ **Comprehensive Logging** - Full audit trail
- ✅ **Production Tested** - Successfully deployed and working
- ✅ **Error Recovery** - Graceful failure handling
- ✅ **Scalable Architecture** - Handles multiple subjects/students

The system is **production-ready** and **fully automated**! 🚀