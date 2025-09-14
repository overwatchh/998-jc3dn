// Server initialization - runs when the Next.js app starts
import { initializeLectureEndScheduler } from './lecture-end-scheduler';

let initialized = false;

export function initializeServer() {
  if (initialized) {
    return;
  }

  console.log('🔧 Initializing QR Attendance System server...');
  
  try {
    // Initialize automatic lecture end scheduler
    initializeLectureEndScheduler();
    
    initialized = true;
    console.log('✅ Server initialization completed successfully');
    console.log('📧 Email system ready with automatic lecture end triggers');
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
  }
}

// Auto-initialize when this module is imported
// Only run on server-side and NOT during build phase
if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  initializeServer();
}