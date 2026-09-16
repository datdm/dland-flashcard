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

export default router;
