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

// Get progress data (vocabulary + grammar)
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

    res.json({
      success: true,
      data: {
        vocabulary: vocabResult.rows[0]?.data_value || {},
        grammar: grammarResult.rows[0]?.data_value || {},
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

export default router;
