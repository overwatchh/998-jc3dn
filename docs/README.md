# 📚 QR Attendance System - Documentation

Welcome to the QR Attendance System documentation. This system includes comprehensive email reminder functionality for students below attendance thresholds.

## 📋 Documentation Index

### 🚀 Getting Started
- **[Quick Reference](QUICK_REFERENCE.md)** - Commands, APIs, and quick fixes
- **[Testing Guide](../TESTING_GUIDE.md)** - Step-by-step testing instructions
- **[System Setup](../EMAIL_REMINDER_SYSTEM.md)** - Installation and configuration

### 📧 Email Reminder System
- **[Complete Documentation](EMAIL_REMINDER_SYSTEM_DOCUMENTATION.md)** - Full system documentation
- **[System Flow Explanation](../SYSTEM_FLOW_EXPLANATION.md)** - How the system works

### 🔧 Technical Reference
- **[API Examples](../api-test-examples.http)** - REST API testing examples
- **Database Schema** - See `src/lib/server/db_schema/db_create.sql`
- **Service Architecture** - See `src/services/server/` directory

### 🧪 Testing & Development
- **Test Scripts** - Various `test-*.js` files in project root
- **Sample Data** - `create-test-data.js` and `create-test-data.sql`
- **Environment Setup** - See `.env.local` configuration

## 🎯 System Overview

The QR Attendance System is a comprehensive solution for tracking student attendance using QR codes. The email reminder system automatically monitors attendance and sends escalating notifications to students falling below required thresholds.

### Key Features
- ✅ QR Code-based attendance tracking
- 📧 Automated email reminder system
- 📊 Real-time attendance calculations  
- 🎯 Three-tier escalation (reminder → warning → critical)
- 👥 Multi-role notifications (students + lecturers)
- 🔧 Course-specific configuration
- 📝 Complete audit trail
- 🛡️ Security and authentication

### Architecture
```
QR Scan → Database → Attendance Calculation → Email Decision → Send Email → Log Activity
```

## 🚀 Quick Start

1. **Test Email System**
   ```bash
   node test-email.js
   ```

2. **Verify Database**
   ```bash
   node test-attendance-system.js
   ```

3. **Process Reminders**
   ```bash
   npm run attendance:reminders
   ```

4. **View Results**
   - Check database: `node check-sent-emails.js`
   - View emails: https://ethereal.email/messages

## 📞 Support

- **Issues**: Check troubleshooting sections in documentation
- **Testing**: Follow step-by-step testing guide
- **Configuration**: Refer to environment variable documentation
- **API**: Use provided REST API examples

## 📁 File Structure
```
docs/
├── README.md                              # This file
├── QUICK_REFERENCE.md                     # Quick commands and references
└── EMAIL_REMINDER_SYSTEM_DOCUMENTATION.md # Complete system documentation

Root Files:
├── EMAIL_REMINDER_SYSTEM.md              # Implementation guide
├── TESTING_GUIDE.md                      # Testing procedures
├── SYSTEM_FLOW_EXPLANATION.md            # System workflow
├── api-test-examples.http                # API examples
└── test-*.js                             # Testing scripts
```

---

*For the most up-to-date information, refer to the individual documentation files listed above.*