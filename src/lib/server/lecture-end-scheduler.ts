import cron, { ScheduledTask } from 'node-cron';

const scheduledJobs = new Map<number, ScheduledTask>();

async function triggerLectureEndEmail(sessionId: number, weekNumber: number = 1) {
  console.log(`🎯 Automatic lecture end trigger for session ${sessionId}, week ${weekNumber}`);
  
  try {
    const response = await fetch(`http://localhost:3000/api/system/lecture-end-trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        system_key: 'attendance_email_system_2024',
        study_session_id: sessionId,
        week_number: weekNumber,
        source: 'automatic_scheduler'
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Automatic email trigger successful:`, result);
    } else {
      const error = await response.text();
      console.log(`⚠️ Automatic email trigger failed:`, error);
    }
  } catch (error) {
    console.error(`❌ Error in automatic email trigger:`, error);
  }
}

export function scheduleSessionEnd(sessionId: number, endTime: string, dayOfWeek: string, weekNumber: number = 1) {
  // Parse end time (format: HH:MM:SS)
  const [hours, minutes] = endTime.split(':').map(Number);
  
  // Create cron pattern for this specific time and day
  const dayNum = getDayNumber(dayOfWeek);
  const cronPattern = `${minutes} ${hours} * * ${dayNum}`;
  
  console.log(`⏰ Scheduling session ${sessionId} to end at ${endTime} on ${dayOfWeek} with pattern: ${cronPattern}`);

  // Cancel existing job if any
  if (scheduledJobs.has(sessionId)) {
    scheduledJobs.get(sessionId)?.destroy();
  }

  // Schedule new job
  const task = cron.schedule(cronPattern, () => {
    triggerLectureEndEmail(sessionId, weekNumber);
  }, {
    timezone: "America/New_York" // Adjust to your timezone
  } as { timezone: string });

  scheduledJobs.set(sessionId, task);
  return task;
}

function getDayNumber(dayName: string): number {
  const days: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  return days[dayName] || 0;
}

export async function initializeLectureEndScheduler() {
  console.log('🚀 Initializing automatic lecture end scheduler...');
  
  try {
    // Query database to find all sessions for today
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    console.log(`📅 Looking for sessions on ${today}...`);
    
    const _response = await fetch(`http://localhost:3000/api/system/init`);
    // For now, we'll use a simple approach - schedule all sessions at their end times
    // This will be improved to query the database properly
    
    // Schedule a catch-all job that runs every minute and checks for ended sessions
    const { schedule } = await import('node-cron');
    schedule('* * * * *', async () => {
      // This runs every minute and checks if any sessions just ended
      await checkForEndedSessions();
    });
    
    console.log('✅ Automatic lecture end scheduler initialized (dynamic mode)');
  } catch (error) {
    console.error('❌ Error initializing scheduler:', error);
  }
}

async function checkForEndedSessions() {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Check if current time matches any session end time
  // This would ideally query the database, but for now we'll check common times
  const commonEndTimes = ['23:15:00', '23:35:00']; // Add more as needed
  
  if (commonEndTimes.includes(currentTime)) {
    console.log(`🎯 Checking for sessions ending at ${currentTime} on ${currentDay}`);
    
    // Try to trigger for any active sessions (this is a temporary approach)
    for (const sessionId of [101, 102, 103]) { // Common session IDs
      try {
        await triggerLectureEndEmail(sessionId, 1);
      } catch (_error) {
        // Ignore errors for non-existent sessions
      }
    }
  }
}