import express, { Response } from 'express';
import pool from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// GET /api/admin/users - Get all users with stats
router.get('/users', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.id, 
        u.username, 
        u.created_at, 
        u.last_sync_at, 
        u.is_admin,
        (SELECT data_value FROM user_data WHERE user_id = u.id AND data_key = 'flashcash-settings') as settings,
        (SELECT data_value FROM user_data WHERE user_id = u.id AND data_key = 'flashcash-progress') as progress,
        (SELECT data_value FROM user_data WHERE user_id = u.id AND data_key = 'flashcash-grammar-progress') as grammar_progress,
        (SELECT data_value FROM user_data WHERE user_id = u.id AND data_key = 'flashcash-kanji-progress') as kanji_progress,
        (SELECT data_value FROM user_data WHERE user_id = u.id AND data_key = 'flashcash-notebooks') as notebooks
      FROM users u
      WHERE u.is_admin = FALSE OR u.is_admin IS NULL
      ORDER BY u.created_at DESC`
    );

    const users = result.rows.map((row) => {
      const settings = row.settings || {};
      const progress = row.progress || {};
      const grammarProgress = row.grammar_progress || {};
      const kanjiProgress = row.kanji_progress || {};
      const notebooksData = row.notebooks || {};
      const notebooksList = Array.isArray(notebooksData.notebooks) ? notebooksData.notebooks : [];

      // Calculate counts
      const vocabLearnedCount = Object.values(progress).filter((p: any) => p && p.learned).length;
      const grammarLearnedCount = Object.values(grammarProgress).filter((p: any) => p && p.learned).length;
      const kanjiLearnedCount = Object.values(kanjiProgress).filter((p: any) => p && p.learned).length;

      return {
        id: row.id,
        username: row.username,
        createdAt: row.created_at,
        lastSyncAt: row.last_sync_at,
        isAdmin: !!row.is_admin,
        activeLanguage: settings.activeLangCode || 'ja',
        vocabLearnedCount,
        grammarLearnedCount,
        kanjiLearnedCount,
        notebookCount: notebooksList.length,
      };
    });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// GET /api/admin/users/:userId - Get detailed user study progress
router.get('/users/:userId', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  try {
    // Verify user exists
    const userCheck = await pool.query(
      'SELECT id, username, created_at, last_sync_at, is_admin FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userCheck.rows[0];

    // Fetch all user data keys
    const result = await pool.query(
      'SELECT data_key, data_value FROM user_data WHERE user_id = $1',
      [userId]
    );

    const data: Record<string, any> = {};
    result.rows.forEach((row) => {
      data[row.data_key] = row.data_value;
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.created_at,
        lastSyncAt: user.last_sync_at,
        isAdmin: !!user.is_admin,
      },
      data: {
        curriculums: data['flashcash-curriculums']?.curriculums || [],
        notebooks: data['flashcash-notebooks']?.notebooks || [],
        progress: data['flashcash-progress'] || {},
        grammarProgress: data['flashcash-grammar-progress'] || {},
        kanjiProgress: data['flashcash-kanji-progress'] || {},
        curriculumHistory: data['flashcash-curriculum-history'] || [],
        settings: data['flashcash-settings'] || {},
      },
    });
  } catch (error) {
    console.error('Admin get user detail error:', error);
    res.status(500).json({ error: 'Failed to retrieve user details' });
  }
});

// GET /api/admin/nav-dev-overrides - Public endpoint: fetch admin's nav dev item overrides
// All users (including unauthenticated) can read this to know which items are dev-only
router.get('/nav-dev-overrides', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT value FROM app_settings WHERE key = 'nav_dev_item_overrides'`
    );
    const overrides = result.rows[0]?.value ?? {};
    res.json({ success: true, overrides });
  } catch (error) {
    console.error('Get nav dev overrides error:', error);
    res.status(500).json({ error: 'Failed to load nav dev overrides' });
  }
});

// PUT /api/admin/nav-dev-overrides - Admin only: save nav dev item overrides to DB
router.put('/nav-dev-overrides', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { overrides } = req.body;
  if (!overrides || typeof overrides !== 'object') {
    return res.status(400).json({ error: 'Invalid overrides payload' });
  }
  try {
    await pool.query(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ('nav_dev_item_overrides', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(overrides)]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Save nav dev overrides error:', error);
    res.status(500).json({ error: 'Failed to save nav dev overrides' });
  }
});
// GET /api/admin/export-full-db - Admin only: Export full system database (All users, user data, backup history, settings)
router.get('/export-full-db', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const usersResult = await pool.query(
      `SELECT id, username, password_hash, created_at, last_sync_at, is_admin FROM users ORDER BY created_at DESC`
    );
    const userDataResult = await pool.query(
      `SELECT id, user_id, data_key, data_value, updated_at FROM user_data`
    );
    const backupHistoryResult = await pool.query(
      `SELECT id, user_id, backup_data, created_at, backup_type, data_keys, note FROM backup_history ORDER BY created_at DESC`
    );
    const appSettingsResult = await pool.query(
      `SELECT key, value, updated_at FROM app_settings`
    );

    res.json({
      success: true,
      version: '2.0.0',
      type: 'FULL_SYSTEM_DATABASE_DUMP',
      exportedAt: new Date().toISOString(),
      metadata: {
        exportedBy: req.userId || 'Admin',
        totalUsers: usersResult.rows.length,
        totalUserDataRecords: userDataResult.rows.length,
        totalBackups: backupHistoryResult.rows.length,
        totalAppSettings: appSettingsResult.rows.length,
      },
      users: usersResult.rows,
      userData: userDataResult.rows,
      backupHistory: backupHistoryResult.rows,
      appSettings: appSettingsResult.rows,
    });
  } catch (error: any) {
    console.error('Export full system DB error:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi xuất toàn bộ database hệ thống' });
  }
});

// POST /api/admin/import-full-db - Admin only: Import/Restore full system database (All users, user data, backup history, settings)
router.post('/import-full-db', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { dump, mode = 'merge' } = req.body;
  if (!dump || typeof dump !== 'object') {
    return res.status(400).json({ error: 'Dữ liệu dump không hợp lệ' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (mode === 'replace') {
      await client.query('DELETE FROM backup_history');
      await client.query('DELETE FROM user_data');
      await client.query('DELETE FROM users WHERE is_admin IS NOT TRUE');
    }

    let usersImported = 0;
    let userDataImported = 0;
    let backupsImported = 0;
    let settingsImported = 0;

    // Restore users
    if (Array.isArray(dump.users)) {
      for (const u of dump.users) {
        if (!u.id || !u.username) continue;
        await client.query(
          `INSERT INTO users (id, username, password_hash, created_at, last_sync_at, is_admin)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             username = EXCLUDED.username,
             last_sync_at = EXCLUDED.last_sync_at,
             is_admin = EXCLUDED.is_admin`,
          [
            u.id,
            u.username,
            u.password_hash || '$2b$10$dummyhashforrestoreduser',
            u.created_at || new Date(),
            u.last_sync_at || null,
            !!u.is_admin,
          ]
        );
        usersImported++;
      }
    }

    // Restore user_data
    if (Array.isArray(dump.userData)) {
      for (const ud of dump.userData) {
        if (!ud.user_id || !ud.data_key) continue;
        await client.query(
          `INSERT INTO user_data (user_id, data_key, data_value, updated_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, data_key) DO UPDATE SET
             data_value = EXCLUDED.data_value,
             updated_at = EXCLUDED.updated_at`,
          [
            ud.user_id,
            ud.data_key,
            typeof ud.data_value === 'string' ? ud.data_value : JSON.stringify(ud.data_value),
            ud.updated_at || new Date(),
          ]
        );
        userDataImported++;
      }
    }

    // Restore backup_history
    if (Array.isArray(dump.backupHistory)) {
      for (const bh of dump.backupHistory) {
        if (!bh.user_id || !bh.backup_data) continue;
        await client.query(
          `INSERT INTO backup_history (id, user_id, backup_data, created_at, backup_type, data_keys, note)
           VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             backup_data = EXCLUDED.backup_data,
             note = EXCLUDED.note`,
          [
            bh.id || null,
            bh.user_id,
            typeof bh.backup_data === 'string' ? bh.backup_data : JSON.stringify(bh.backup_data),
            bh.created_at || new Date(),
            bh.backup_type || 'auto',
            bh.data_keys || [],
            bh.note || null,
          ]
        );
        backupsImported++;
      }
    }

    // Restore app_settings
    if (Array.isArray(dump.appSettings)) {
      for (const s of dump.appSettings) {
        if (!s.key) continue;
        await client.query(
          `INSERT INTO app_settings (key, value, updated_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (key) DO UPDATE SET
             value = EXCLUDED.value,
             updated_at = EXCLUDED.updated_at`,
          [
            s.key,
            typeof s.value === 'string' ? s.value : JSON.stringify(s.value),
            s.updated_at || new Date(),
          ]
        );
        settingsImported++;
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Đã nhập thành công toàn bộ System Database (${usersImported} người dùng, ${userDataImported} bản ghi dữ liệu, ${backupsImported} bản backup, ${settingsImported} cấu hình)!`,
      stats: { usersImported, userDataImported, backupsImported, settingsImported },
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Import full system DB error:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi nhập toàn bộ database hệ thống' });
  } finally {
    client.release();
  }
});

export default router;
