import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import pool, { runMigrations } from './db';
import authRoutes from './routes/auth';
import syncRoutes from './routes/sync';
import backupRoutes from './routes/backup';
import vocabRoutes from './routes/vocab';
import dataRoutes from './routes/data';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/vocab', vocabRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function ensureDefaultAdmin() {
  const username = 'admin@dland.com';
  const password = 'admin123';

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const checkUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    
    if (checkUser.rows.length > 0) {
      // User exists, update to admin
      await pool.query(
        'UPDATE users SET is_admin = TRUE WHERE username = $1',
        [username]
      );
      console.log(`👤 Verified admin status for "${username}"`);
    } else {
      // Create new admin user
      await pool.query(
        'INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, TRUE)',
        [username, passwordHash]
      );
      console.log(`👤 Created default Admin user "${username}" successfully.`);
    }
  } catch (error) {
    console.error('❌ Failed to ensure default admin user:', error);
  }
}

// Start server
async function start() {
  try {
    // Run database migrations
    console.log('🔄 Running database migrations...');
    await runMigrations();

    // Ensure default admin user exists
    console.log('👤 Ensuring default admin user...');
    await ensureDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
