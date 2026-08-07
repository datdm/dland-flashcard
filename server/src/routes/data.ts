import express, { Response } from 'express';
import pool from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get notebooks data
router.get('/notebooks', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT data_value FROM user_data 
       WHERE user_id = $1 AND data_key = $2`,
      [req.userId, 'flashcash-notebooks']
    );

    const notebooks = result.rows[0]?.data_value || [];

    res.json({
      success: true,
      data: notebooks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get notebooks error:', error);
    res.status(500).json({ error: 'Failed to load notebooks' });
  }
});

// Get curriculums data
router.get('/curriculums', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT data_value FROM user_data 
       WHERE user_id = $1 AND data_key = $2`,
      [req.userId, 'flashcash-curriculums']
    );

    const curriculums = result.rows[0]?.data_value || [];

    res.json({
      success: true,
      data: curriculums,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get curriculums error:', error);
    res.status(500).json({ error: 'Failed to load curriculums' });
  }
});

// Get grammar collections data
router.get('/grammar-collections', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT data_value FROM user_data 
       WHERE user_id = $1 AND data_key = $2`,
      [req.userId, 'flashcash-grammar-collections']
    );

    const collections = result.rows[0]?.data_value || [];

    res.json({
      success: true,
      data: collections,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get grammar collections error:', error);
    res.status(500).json({ error: 'Failed to load grammar collections' });
  }
});

// Get progress data (vocabulary + grammar + kanji)
router.get('/progress', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const vocabResult = await pool.query(
      `SELECT data_value FROM user_data 
       WHERE user_id = $1 AND data_key = $2`,
      [req.userId, 'flashcash-progress']
    );

    const grammarResult = await pool.query(
      `SELECT data_value FROM user_data 
       WHERE user_id = $1 AND data_key = $2`,
      [req.userId, 'flashcash-grammar-progress']
    );

    const kanjiResult = await pool.query(
      `SELECT data_value FROM user_data 
       WHERE user_id = $1 AND data_key = $2`,
      [req.userId, 'flashcash-kanji-progress']
    );

    res.json({
      success: true,
      data: {
        vocabulary: vocabResult.rows[0]?.data_value || {},
        grammar: grammarResult.rows[0]?.data_value || {},
        kanji: kanjiResult.rows[0]?.data_value || {},
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to load progress' });
  }
});

// Get settings data
router.get('/settings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT data_value FROM user_data 
       WHERE user_id = $1 AND data_key = $2`,
      [req.userId, 'flashcash-settings']
    );

    const settings = result.rows[0]?.data_value || {};

    res.json({
      success: true,
      data: settings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// PATCH /progress/:vocabId – delta update a single vocab's progress (learned/favorite)
router.patch('/progress/:vocabId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { vocabId } = req.params;
    const patch = req.body; // e.g. { learned: true, learnedAt: "...", favorite: false }

    if (!patch || typeof patch !== 'object') {
      return res.status(400).json({ error: 'Thiếu dữ liệu patch' });
    }

    // Only allow safe progress fields
    const allowedFields = ['learned', 'learnedAt', 'favorite'];
    const safePatch: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in patch) safePatch[field] = patch[field];
    }

    if (Object.keys(safePatch).length === 0) {
      return res.status(400).json({ error: 'Không có trường hợp lệ để cập nhật' });
    }

    // Read existing progress
    const result = await pool.query(
      `SELECT data_value FROM user_data WHERE user_id = $1 AND data_key = $2`,
      [userId, 'flashcash-progress']
    );

    const existingProgress: Record<string, any> = result.rows[0]?.data_value || {};

    // Merge patch into specific vocab entry
    existingProgress[vocabId] = {
      learned: false,
      favorite: false,
      ...(existingProgress[vocabId] || {}),
      ...safePatch,
    };

    // Save back
    await pool.query(
      `INSERT INTO user_data (user_id, data_key, data_value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, data_key)
       DO UPDATE SET data_value = $3, updated_at = NOW()`,
      [userId, 'flashcash-progress', JSON.stringify(existingProgress)]
    );

    await pool.query('UPDATE users SET last_sync_at = NOW() WHERE id = $1', [userId]);

    res.json({ success: true, entry: existingProgress[vocabId] });
  } catch (error) {
    console.error('Patch progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
