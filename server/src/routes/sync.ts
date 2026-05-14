import express, { Response } from 'express';
import pool from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get user's data from server
router.get('/data', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT data_key, data_value, updated_at FROM user_data WHERE user_id = $1',
      [req.userId]
    );

    const data: Record<string, any> = {};
    result.rows.forEach((row) => {
      data[row.data_key] = row.data_value;
    });

    // Update last sync time
    await pool.query(
      'UPDATE users SET last_sync_at = NOW() WHERE id = $1',
      [req.userId]
    );

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload user's data to server
router.post('/upload', authenticate, async (req: AuthRequest, res: Response) => {
  const { data } = req.body;

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const validKeys = [
      'flashcash-lessons',
      'flashcash-progress',
      'flashcash-settings',
      'flashcash-notebooks',
      'flashcash-curriculums',
      'flashcash-grammar-collections',
      'flashcash-grammar-progress',
    ];

    // First, backup current data before overwriting
    const currentDataResult = await client.query(
      'SELECT data_key, data_value FROM user_data WHERE user_id = $1',
      [req.userId]
    );

    if (currentDataResult.rows.length > 0) {
      // Build backup data object
      const backupData: Record<string, any> = {};
      const dataKeys: string[] = [];
      
      currentDataResult.rows.forEach((row) => {
        backupData[row.data_key] = row.data_value;
        dataKeys.push(row.data_key);
      });

      // Save backup to backup_history
      await client.query(
        `INSERT INTO backup_history (user_id, backup_data, backup_type, data_keys, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.userId,
          JSON.stringify(backupData),
          'auto',
          dataKeys,
          'Auto backup before sync upload'
        ]
      );
    }

    // Now upload new data
    for (const [key, value] of Object.entries(data)) {
      if (!validKeys.includes(key)) {
        continue; // Skip invalid keys
      }

      await client.query(
        `INSERT INTO user_data (user_id, data_key, data_value, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, data_key)
         DO UPDATE SET data_value = $3, updated_at = NOW()`,
        [req.userId, key, value]
      );
    }

    // Update last sync time
    await client.query(
      'UPDATE users SET last_sync_at = NOW() WHERE id = $1',
      [req.userId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Data uploaded successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Check if user has data on server
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM user_data WHERE user_id = $1',
      [req.userId]
    );

    const hasData = parseInt(result.rows[0].count) > 0;

    const userResult = await pool.query(
      'SELECT last_sync_at FROM users WHERE id = $1',
      [req.userId]
    );

    res.json({
      success: true,
      hasData,
      lastSyncAt: userResult.rows[0]?.last_sync_at || null,
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
