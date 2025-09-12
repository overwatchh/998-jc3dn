// Server initialization - runs when the Next.js app starts
import { initializeSchedulerFromEnv } from './email-scheduler';
import { initializeEnhancedSchedulerFromEnv } from './enhanced-email-scheduler';

let initialized = false;

export function initializeServer() {
  if (initialized) {
    return;
  }

  console.log('🔧 Initializing QR Attendance System server...');
  
  try {
    // Use the original scheduler for stable performance during presentations
    // initializeSchedulerFromEnv();
    
    // Enhanced scheduler available for production use
    initializeEnhancedSchedulerFromEnv();
    
    initialized = true;
    console.log('✅ Server initialization completed successfully');
    console.log('⚡ Real-time email processing active for multiple classes');
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
  }
}

// Auto-initialize when this module is imported
// Only run on server-side and NOT during build phase
if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  initializeServer();
}