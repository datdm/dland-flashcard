-- Create backup_history table to store snapshots of user data before each sync
CREATE TABLE IF NOT EXISTS backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  backup_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  backup_type VARCHAR(20) DEFAULT 'auto',
  data_keys TEXT[] DEFAULT '{}',
  note TEXT
);

-- Index for faster queries by user_id and created_at
CREATE INDEX IF NOT EXISTS idx_backup_history_user_id ON backup_history(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_history_created_at ON backup_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_history_user_created ON backup_history(user_id, created_at DESC);
