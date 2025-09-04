# Email Reminder System for Partial Attendance

## Overview
Implement automated email reminders for students who only attend the first check-in (30% attendance) but miss the second check-in, encouraging them to return for full attendance.

## Current Attendance Logic
- **Full Attendance (100%)**: Both first + second check-ins
- **Partial Attendance (30%)**: First check-in only 
- **Absent (0%)**: No check-ins

## Email Reminder System

### 1. Triggers
- **After first validity window ends**: Send reminder to students with only first check-in
- **During second validity window**: Remind students they can still get full attendance
- **Before class ends**: Final reminder for students with partial attendance

### 2. Email Types
- **Immediate Reminder**: Sent when first window closes, student has 30% attendance
- **Final Call**: Sent during second window, urging return for full attendance  
- **Weekly Summary**: Weekly report of attendance status for all subjects

### 3. Email Templates
- Subject: "⚠️ Partial Attendance Alert - [Subject] [Week] [Session Type]"
- Personalized content with attendance percentage and next steps
- Clear CTA to return for second check-in

### 4. Technical Implementation
- Background job to monitor attendance after validity windows
- Email service integration (NodeMailer/SendGrid)
- Queue system for batch email sending
- Attendance calculation service

### 5. Database Extensions
- Email log table to track sent reminders
- Attendance summary table for quick queries
- Email preferences for students

## Implementation Steps
1. Fix current check-in logic to support both validity windows
2. Create attendance calculation service  
3. Set up email service and templates
4. Build monitoring system for partial attendance
5. Create background jobs for email triggers