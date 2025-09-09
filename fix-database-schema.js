const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function fixDatabaseSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔧 Fixing database schema to match our schema file...');
    
    // Check if email_reminder_logs table exists
    const [tables] = await connection.execute(`SHOW TABLES LIKE 'email_reminder_logs'`);
    
    if (tables.length > 0) {
      console.log('📋 Current table structure:');
      const [columns] = await connection.execute('DESCRIBE email_reminder_logs');
      columns.forEach(col => {
        console.log(`   ${col.Field} | ${col.Type}`);
      });

      // Check if course_id column exists
      const hasCourseId = columns.some(col => col.Field === 'course_id');
      const hasSubjectId = columns.some(col => col.Field === 'subject_id');

      if (hasCourseId && !hasSubjectId) {
        console.log('🔄 Renaming course_id to subject_id to match schema...');
        
        // Rename course_id to subject_id
        await connection.execute(`
          ALTER TABLE email_reminder_logs 
          CHANGE COLUMN course_id subject_id INT NOT NULL
        `);
        
        console.log('✅ Column renamed successfully');
        
        // Verify the change
        const [newColumns] = await connection.execute('DESCRIBE email_reminder_logs');
        console.log('📋 Updated table structure:');
        newColumns.forEach(col => {
          console.log(`   ${col.Field} | ${col.Type}`);
        });
      } else if (hasSubjectId) {
        console.log('✅ Table already has subject_id column');
      } else {
        console.log('⚠️  Table has neither course_id nor subject_id!');
      }
    } else {
      console.log('❌ email_reminder_logs table does not exist');
      console.log('🆕 Creating email_reminder_logs table from schema...');
      
      // Create the table according to our schema
      await connection.execute(`
        CREATE TABLE email_reminder_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id VARCHAR(36) NOT NULL,
          subject_id INT NOT NULL,
          reminder_type ENUM('first_absence', 'second_absence', 'critical_absence') NOT NULL,
          session_type ENUM('lecture', 'lab') NOT NULL,
          missed_count INT NOT NULL,
          total_sessions INT NOT NULL,
          attendance_percentage DECIMAL(5,2) NOT NULL,
          email_subject TEXT NOT NULL,
          email_body TEXT NOT NULL,
          sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          email_status ENUM('sent', 'failed', 'pending') NOT NULL DEFAULT 'pending',
          FOREIGN KEY (student_id) REFERENCES \`user\` (\`id\`),
          FOREIGN KEY (subject_id) REFERENCES subject(id),
          INDEX idx_student_subject (student_id, subject_id),
          INDEX idx_sent_at (sent_at)
        )
      `);
      
      console.log('✅ Table created successfully');
    }

  } catch (error) {
    console.error('❌ Error fixing schema:', error.message);
  } finally {
    await connection.end();
  }
}

fixDatabaseSchema();