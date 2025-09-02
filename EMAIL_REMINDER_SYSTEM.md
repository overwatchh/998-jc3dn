# Automated Email Reminder System for Student Attendance

This document describes the automated email reminder system that tracks student attendance and sends appropriate notifications when students fall below the required 80% attendance threshold.

## System Overview

The email reminder system consists of several interconnected components:

1. **Attendance Calculation Service** - Calculates attendance percentages and tracks missed sessions
2. **Email Service** - Handles email template generation and delivery
3. **Attendance Reminder Service** - Orchestrates the reminder logic and scheduling
4. **API Endpoints** - Provides REST APIs for manual processing and configuration
5. **Database Tables** - Stores email history and settings

## Features

### Attendance Tracking
- Calculates attendance percentages per student per course per session type (lecture/lab)
- Tracks total sessions, attended sessions, and missed sessions
- Identifies students below the 80% attendance threshold
- Calculates remaining allowable absences

### Three-Tier Email System
- **First Reminder**: Friendly notice after first concerning absence
- **Second Warning**: Warning that no more classes can be missed
- **Critical Notice**: Final notice when threshold is exceeded, includes lecturer contact

### Automated Processing
- Daily automated processing of all active courses
- Prevents duplicate emails within 24-hour windows
- Comprehensive logging of all email activities

### Manual Controls
- Admin interface for manual processing
- Course-specific settings configuration
- Enable/disable email notifications per course

## Database Schema

The system uses several database tables that are already included in the schema:

- `email_reminder_settings` - Course-specific reminder settings
- `email_reminder_logs` - History of all sent reminders
- `student_attendance_summary` - Cached attendance statistics for performance

## Environment Configuration

Add these environment variables to your `.env.local`:

```env
# Email Service Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@domain.com

# Cron Job Security
CRON_SECRET=your-secure-random-secret-key
```

## API Endpoints

### Admin Reminder Processing
- `POST /api/admin/attendance/reminders`
  - Process all reminders: `{ "action": "process_all" }`
  - Process course: `{ "action": "process_course", "courseId": 123 }`
  - Process student: `{ "action": "process_student", "studentId": "abc", "courseId": 123 }`

- `GET /api/admin/attendance/reminders`
  - Get history: `?action=history&studentId=abc&courseId=123&limit=50`
  - Get statistics: `?action=statistics&courseId=123`

### Settings Management
- `PUT /api/admin/attendance/settings` - Update course reminder settings
- `POST /api/admin/attendance/settings` - Enable/disable email reminders

### Automated Cron Job
- `GET /api/cron/attendance-reminders` - Daily automated processing (requires Authorization header)

## Manual Processing

### Command Line Scripts
```bash
# Process all attendance reminders
npm run attendance:reminders

# Test reminder for specific student
npm run attendance:test-reminder <studentId> <courseId>
```

### Admin Interface
Use the React hooks provided in `src/hooks/useAttendanceReminders.ts`:

```typescript
import { useProcessAllReminders, useReminderHistory } from "@/hooks/useAttendanceReminders";

// Process all reminders
const { mutate: processReminders } = useProcessAllReminders();

// View reminder history
const { data: history } = useReminderHistory(studentId, courseId);
```

## Email Templates

### Template 1: First Reminder
- **Subject**: "Attendance Notice - [Course Name]"
- **Content**: Friendly reminder about maintaining 80% attendance
- **Shows**: Current attendance status and remaining allowable misses

### Template 2: Second Warning  
- **Subject**: "Important: Attendance Warning - [Course Name]"
- **Content**: Warning that no more classes can be missed
- **Shows**: Critical status and required actions

### Template 3: Critical Notice
- **Subject**: "Critical: Attendance Below Threshold - [Course Name]"
- **Content**: Final notice with lecturer contact information
- **Recipients**: Student + Lecturer (CC)

## Automated Scheduling

### Daily Processing
Set up a cron job or scheduled task to call the automated endpoint:

```bash
# Daily at 8:00 AM
0 8 * * * curl -H "Authorization: Bearer your-cron-secret" https://your-domain.com/api/cron/attendance-reminders
```

### Alternative: GitHub Actions
Create `.github/workflows/attendance-reminders.yml`:

```yaml
name: Daily Attendance Reminders
on:
  schedule:
    - cron: '0 8 * * *'  # Daily at 8:00 AM UTC
jobs:
  process-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Call Reminder API
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/attendance-reminders
```

## Usage Examples

### 1. Enable Email Reminders for a Course
```typescript
const { mutate } = useToggleReminderEmails();
mutate({ courseId: 123, enabled: true });
```

### 2. Update Course Settings
```typescript
const { mutate } = useUpdateReminderSettings();
mutate({
  courseId: 123,
  settings: {
    lectureCount: 13,
    labCount: 12,
    attendanceThreshold: 0.80,
    emailEnabled: true
  }
});
```

### 3. View Attendance Statistics
```typescript
const { data: stats } = useAttendanceStatistics(123);
// Returns statistics for course 123 or all courses if no ID provided
```

### 4. Process Reminders for Single Course
```typescript
const { mutate } = useProcessCourseReminders();
mutate(123); // Process reminders for course ID 123
```

## Monitoring and Logs

### Email Log Structure
- Student and course information
- Reminder type and session type
- Attendance statistics at time of sending
- Email status (sent/failed/pending)
- Full email content for audit purposes

### Processing Results
Each processing operation returns:
- Total students processed
- Emails successfully sent
- Failed email attempts
- Students skipped (recent email already sent)
- Array of any errors encountered

## Security Considerations

- All admin endpoints require admin role authentication
- Cron endpoints require bearer token authentication
- Email templates sanitize all user input
- No sensitive data stored in email logs
- Rate limiting prevents spam (24-hour windows between similar emails)

## Testing

### Test Email Service Connection
```typescript
import { emailService } from '@/services/server/emailService';
const isConnected = await emailService.testConnection();
```

### Test Single Student Reminder
```bash
npm run attendance:test-reminder student123 456
```

### Manual Processing Test
Access the admin API endpoints with appropriate authentication to test the complete flow.

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Verify SMTP configuration in environment variables
   - Test email service connection
   - Check email service logs

2. **No reminders being processed**
   - Verify course has `email_enabled = TRUE` in settings
   - Check if students are actually below threshold
   - Ensure no recent emails were sent (24-hour window)

3. **Cron job not working**
   - Verify `CRON_SECRET` matches in environment and request
   - Check server logs for processing errors
   - Ensure proper authentication headers

### Log Analysis
Check the `email_reminder_logs` table for detailed information about all email processing attempts, including failure reasons.

## Performance Considerations

- Attendance summary cache table reduces calculation overhead
- Batch processing for multiple courses
- 24-hour duplicate prevention reduces email volume
- Database indexing on frequently queried columns

## Future Enhancements

Potential improvements to the system:
- SMS notifications for critical alerts
- Customizable email templates per institution
- Advanced analytics and reporting
- Integration with learning management systems
- Multi-language support for email templates