import { runMigrations } from '../db';

async function run() {
  try {
    await runMigrations();
    console.log('✅ Migrations executed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

run();
