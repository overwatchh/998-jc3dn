# 📧 Email Reminder System - How It Works

## 🎯 **Core Concept**
The system monitors student attendance and automatically sends escalating email warnings when students fall below the 80% attendance threshold.

## 🔄 **Complete System Flow**

### **Step 1: Attendance Data Collection**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│ Student scans   │ →  │ Attendance       │ →  │ Database stores     │
│ QR code         │    │ gets recorded    │    │ attendance record   │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```
- Students scan QR codes during lectures/labs
- System records: student_id, session_id, timestamp, location
- Data goes into `attendance` table

### **Step 2: Attendance Calculation (Real-time)**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│ New attendance  │ →  │ Calculate        │ →  │ Update attendance   │
│ record created  │    │ percentages      │    │ summary cache       │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

**AttendanceCalculationService.ts calculates:**
- Total sessions (lectures + labs) per course
- Sessions attended by each student  
- Sessions missed
- **Attendance percentage = (attended / total) × 100**
- Remaining allowable misses before hitting 80% threshold

### **Step 3: Daily Automated Processing**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│ Cron job runs   │ →  │ Check all        │ →  │ Identify students   │
│ daily at 8am    │    │ active courses   │    │ below 80%           │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

**Triggers:**
- **Automated**: Daily cron job hits `/api/cron/attendance-reminders`
- **Manual**: Admin can trigger via API or command line
- **Real-time**: After each attendance scan (optional)

### **Step 4: Smart Email Decision Logic**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│ Student below   │ →  │ Determine email  │ →  │ Check if recent     │
│ 80% threshold   │    │ reminder type    │    │ email already sent  │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

**Email Type Logic:**
- **Critical Notice** (attendance < 80%): "You've exceeded allowable absences"
- **Second Warning** (0 remaining misses): "Cannot miss any more classes"  
- **First Reminder** (1-2 remaining misses): "Friendly reminder to maintain attendance"

**Duplicate Prevention:**
- System checks if email was sent in last 24 hours
- Prevents spam by skipping recently notified students

### **Step 5: Email Generation & Sending**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│ Generate email  │ →  │ Send via SMTP    │ →  │ Log email activity  │
│ from template   │    │ (nodemailer)     │    │ in database         │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

**Email Content Includes:**
- Student name (personalized)
- Course name and code
- Current attendance percentage
- Sessions attended vs. total
- Remaining allowable misses
- Lecturer contact info (for critical notices)
- Specific action items

## 📊 **Database Tables Used**

### **Core Attendance Data:**
- `attendance` - Individual attendance records
- `course_sessions` - Class schedules (lecture/lab)
- `enrollments` - Student-course relationships
- `courses` - Course information

### **Email System Tables:**
- `email_reminder_settings` - Per-course configuration
- `email_reminder_logs` - Complete audit trail of sent emails  
- `student_attendance_summary` - Cached attendance calculations

## 🎛️ **Configuration Options**

### **Per Course Settings:**
```sql
INSERT INTO email_reminder_settings (course_id, lecture_count, lab_count, attendance_threshold, email_enabled) 
VALUES (1, 13, 12, 0.80, true);
```

- **lecture_count**: Expected total lectures in semester
- **lab_count**: Expected total labs in semester
- **attendance_threshold**: Required percentage (default 80%)
- **email_enabled**: Turn on/off for course

## 🚀 **Trigger Methods**

### **1. Automated Daily Processing**
```bash
# Cron job calls this endpoint daily
curl -H "Authorization: Bearer secret" http://localhost:3000/api/cron/attendance-reminders
```

### **2. Manual Processing**
```bash
# Process all courses
npm run attendance:reminders

# Process specific student
npm run attendance:test-reminder student-123 course-456
```

### **3. Admin API Calls**
```javascript
// Process all reminders
POST /api/admin/attendance/reminders
{ "action": "process_all" }

// Process single course  
POST /api/admin/attendance/reminders
{ "action": "process_course", "courseId": 123 }
```

## 📧 **Email Templates**

### **Template 1: First Reminder** 
- **When**: Student has 1-2 classes left to miss
- **Tone**: Friendly, informative
- **Action**: Encourage better attendance

### **Template 2: Second Warning**
- **When**: Student has 0 classes left to miss  
- **Tone**: Warning, urgent
- **Action**: Cannot miss any more classes

### **Template 3: Critical Notice**
- **When**: Student below 80% threshold
- **Tone**: Critical, requires action
- **Action**: Contact lecturer immediately
- **Recipients**: Student + Lecturer (CC)

## 🔄 **Real-World Example Flow**

1. **Week 1-5**: John attends most classes (good attendance)

2. **Week 6**: John misses 2 lectures
   - System calculates: 8/10 lectures attended (80%)
   - No email sent (still at threshold)

3. **Week 7**: John misses 1 more lecture  
   - System calculates: 8/11 lectures attended (72.7%)
   - **First Reminder** email sent: "You have 0 more lectures you can miss"

4. **Week 8**: John misses another lecture
   - System calculates: 8/12 lectures attended (66.7%)  
   - **Critical Notice** sent to John + Professor
   - Email includes lecturer contact info and urgent actions

5. **Database Logging**: 
   - All emails logged in `email_reminder_logs`
   - Admin can track communication history
   - Reports available via API

## 🛡️ **Safety Features**

- **24-hour duplicate prevention**: Won't spam students
- **Course-level enable/disable**: Can turn off per course
- **Multiple session types**: Separate tracking for lectures vs labs  
- **Audit trail**: Every email is logged with full content
- **Error handling**: Failed emails are logged and retried
- **Security**: Admin endpoints require authentication

## 🎯 **Benefits**

1. **Proactive**: Catches attendance issues early
2. **Automated**: Runs without manual intervention  
3. **Escalating**: Appropriate urgency based on situation
4. **Personalized**: Student names, specific attendance data
5. **Professional**: Branded email templates
6. **Auditable**: Complete history of all communications
7. **Configurable**: Per-course settings and thresholds

This system ensures no student falls through the cracks while maintaining professional communication standards!