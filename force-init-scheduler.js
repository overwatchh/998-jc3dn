// Force initialize the enhanced scheduler by importing the init module
const path = require('path');

async function forceInitScheduler() {
  try {
    console.log('🔧 Force initializing enhanced email scheduler...');
    
    // Import the init module to trigger scheduler startup
    const initPath = path.join(__dirname, 'src', 'lib', 'server', 'init.ts');
    console.log('📁 Importing:', initPath);
    
    // This will trigger the enhanced scheduler initialization
    require('./src/lib/server/init.ts');
    
    console.log('✅ Scheduler initialization triggered');
    console.log('🔄 The enhanced scheduler should now be running every 60 seconds');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

forceInitScheduler();