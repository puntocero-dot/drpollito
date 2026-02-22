require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigration() {
  const migrationFile = process.argv[2] || 'add_preferences_and_schedule.sql';
  const migrationPath = path.join(__dirname, 'migrations', migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    console.log(`Running migration: ${migrationFile}`);
    await pool.query(sql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
