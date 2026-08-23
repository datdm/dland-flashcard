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
  const skipBackup = req.query.skipBackup === 'true';
  
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
      'flashcash-kanji-progress',
      'flashcash-curriculum-history',
      'flashcash-practice-history',
      'dland_target_language',
      'dland_kaiwa_completed',
      'flashcash-streak',
      'flashcash-is-daily-50',
    ];

    // First, backup current data before overwriting (skip if auto-sync)
    if (!skipBackup) {
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
    }

    // Now upload new data
    for (const [key, value] of Object.entries(data)) {
      if (!validKeys.includes(key)) {
        continue; // Skip invalid keys
      }

      const jsonString = JSON.stringify(value);

      await client.query(
        `INSERT INTO user_data (user_id, data_key, data_value, updated_at)
         VALUES ($1, $2, $3::jsonb, NOW())
         ON CONFLICT (user_id, data_key)
         DO UPDATE SET data_value = $3::jsonb, updated_at = NOW()`,
        [req.userId, key, jsonString]
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

    const lastSyncAt = userResult.rows[0]?.last_sync_at || null;

    res.json({
      success: true,
      hasData,
      lastSyncAt,
    });
  } catch (error) {
    console.error('Check status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export FULL database (all user_data + backup history)
router.get('/export-full', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userResult = await pool.query(
      'SELECT username, created_at, last_sync_at FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];

    const dataResult = await pool.query(
      'SELECT data_key, data_value, updated_at FROM user_data WHERE user_id = $1',
      [req.userId]
    );
    const userData: Record<string, any> = {};
    dataResult.rows.forEach((row) => {
      userData[row.data_key] = row.data_value;
    });

    const backupsResult = await pool.query(
      'SELECT id, created_at, backup_type, data_keys, note, backup_data FROM backup_history WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    res.json({
      success: true,
      version: '2.0-database-dump',
      exportedAt: new Date().toISOString(),
      metadata: {
        username: user?.username || 'user',
        totalDataKeys: dataResult.rows.length,
        totalBackups: backupsResult.rows.length,
        lastSyncAt: user?.last_sync_at,
      },
      userData,
      backupHistory: backupsResult.rows,
    });
  } catch (error) {
    console.error('Export full DB error:', error);
    res.status(500).json({ error: 'Không thể xuất toàn bộ database' });
  }
});

// Import FULL database (restore user_data and optional backup history)
router.post('/import-full', authenticate, async (req: AuthRequest, res: Response) => {
  const { userData, backupHistory, mode = 'merge' } = req.body;

  if (!userData || typeof userData !== 'object') {
    return res.status(400).json({ error: 'Dữ liệu database không hợp lệ' });
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
      'flashcash-kanji-progress',
      'flashcash-curriculum-history',
      'flashcash-practice-history',
      'dland_target_language',
      'dland_kaiwa_completed',
      'flashcash-streak',
      'flashcash-is-daily-50',
    ];

    if (mode === 'replace') {
      await client.query('DELETE FROM user_data WHERE user_id = $1', [req.userId]);
    }

    let importedKeysCount = 0;
    for (const [key, value] of Object.entries(userData)) {
      if (!validKeys.includes(key)) continue;

      const jsonString = JSON.stringify(value);
      await client.query(
        `INSERT INTO user_data (user_id, data_key, data_value, updated_at)
         VALUES ($1, $2, $3::jsonb, NOW())
         ON CONFLICT (user_id, data_key)
         DO UPDATE SET data_value = $3::jsonb, updated_at = NOW()`,
        [req.userId, key, jsonString]
      );
      importedKeysCount++;
    }

    // Optional restore backup history
    if (Array.isArray(backupHistory) && backupHistory.length > 0) {
      for (const b of backupHistory) {
        if (b.backup_data) {
          await client.query(
            `INSERT INTO backup_history (user_id, backup_data, backup_type, data_keys, note, created_at)
             VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()))`,
            [
              req.userId,
              typeof b.backup_data === 'string' ? b.backup_data : JSON.stringify(b.backup_data),
              b.backup_type || 'manual',
              b.data_keys || Object.keys(b.backup_data),
              b.note || 'Imported from full DB backup',
              b.created_at || null,
            ]
          );
        }
      }
    }

    await client.query('UPDATE users SET last_sync_at = NOW() WHERE id = $1', [req.userId]);
    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Đã import toàn bộ database thành công (${importedKeysCount} nhóm dữ liệu)`,
      importedKeysCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Import full DB error:', error);
    res.status(500).json({ error: 'Lỗi khi nhập toàn bộ database' });
  } finally {
    client.release();
  }
});

export default router;
