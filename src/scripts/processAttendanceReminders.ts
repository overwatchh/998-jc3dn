#!/usr/bin/env tsx

import { attendanceReminderService } from '../services/server/attendanceReminderService';
import { emailJSAttendanceService } from '../services/server/emailJSAttendanceService';

async function main() {
  console.log('🚀 Starting attendance reminder processing...');
  console.log('📅 Date:', new Date().toISOString());
  
  try {
    console.log('🔧 Initializing EmailJS service...');
    const emailJSInitialized = await emailJSAttendanceService.initialize();
    
    if (!emailJSInitialized) {
      console.error('❌ EmailJS initialization failed. Aborting.');
      process.exit(1);
    }
    
    console.log('✅ EmailJS service initialized successfully');
    
    console.log('📊 Processing attendance reminders...');
    const result = await attendanceReminderService.processAllReminders();
    
    console.log('📈 Processing Results:');
    console.log(`   Students Processed: ${result.totalStudentsProcessed}`);
    console.log(`   Emails Sent: ${result.emailsSent}`);
    console.log(`   Emails Failed: ${result.emailsFailed}`);
    console.log(`   Students Skipped: ${result.studentsSkipped}`);
    
    if (result.errors.length > 0) {
      console.log('⚠️  Errors encountered:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (result.emailsFailed > 0) {
      console.log('❌ Some emails failed to send. Check logs for details.');
      process.exit(1);
    }
    
    console.log('✅ Attendance reminder processing completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Fatal error during attendance reminder processing:', error);
    process.exit(1);
  }
}

async function testSingleStudent() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: npm run test-reminder <studentId> <courseId>');
    process.exit(1);
  }
  
  const [studentId, courseId] = args;
  
  console.log(`🧪 Testing reminder for student ${studentId} in course ${courseId}`);
  
  try {
    const success = await attendanceReminderService.processStudentReminder(studentId, parseInt(courseId));
    
    if (success) {
      console.log('✅ Student reminder processed successfully');
    } else {
      console.log('❌ Student reminder failed');
    }
    
  } catch (error) {
    console.error('💥 Error testing student reminder:', error);
  }
}

const command = process.argv[2];

if (command === 'test') {
  testSingleStudent();
} else {
  main();
}