import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;

// Helper function to run migrations
export async function runMigrations() {
  const client = await pool.connect();
  try {
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = path.join(__dirname, '../migrations');
    
    // Get all .sql files in migrations directory, sorted by filename
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file: string) => file.endsWith('.sql'))
      .sort();
    
    console.log(`Running ${migrationFiles.length} migration(s)...`);
    
    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      await client.query(sql);
      console.log(`✅ Migrated: ${file}`);
    }
    
    console.log('✅ All database migrations completed');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    throw error;
  } finally {
    client.release();
  }
}
