import { Router, Response } from 'express';
import pool from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Check if vocabulary already exists in user's data
router.post('/check-duplicate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { kanji, hiragana, notebookId } = req.body;

    if (!kanji?.trim() || !hiragana?.trim()) {
      return res.json({ isDuplicate: false, duplicates: [] });
    }

    // Get user's notebook data
    const result = await pool.query(
      `SELECT data_value FROM user_data 
       WHERE user_id = $1 AND data_key = $2`,
      [userId, 'flashcash-notebooks']
    );

    if (result.rows.length === 0) {
      return res.json({ isDuplicate: false, duplicates: [] });
    }

    const notebooksData = result.rows[0].data_value;
    const notebooks = notebooksData?.notebooks || [];

    const duplicates: Array<{
      notebookId: string;
      notebookName: string;
      vocab: any;
    }> = [];

    const normalizedKanji = kanji.trim();
    const normalizedHiragana = hiragana.trim();

    // Search across all notebooks for duplicates
    for (const nb of notebooks) {
      if (!nb.vocabulary || !Array.isArray(nb.vocabulary)) continue;

      for (const vocab of nb.vocabulary) {
        const kanjiMatch = vocab.kanji?.trim() === normalizedKanji;
        const hiraganaMatch = vocab.hiragana?.trim() === normalizedHiragana;

        if (kanjiMatch && hiraganaMatch) {
          // Skip if it's the same notebook and we're checking for update (not create)
          if (notebookId && nb.id === notebookId) {
            continue;
          }

          duplicates.push({
            notebookId: nb.id,
            notebookName: nb.name,
            vocab: {
              id: vocab.id,
              kanji: vocab.kanji,
              hiragana: vocab.hiragana,
              meaning: vocab.meaning,
              onyomi: vocab.onyomi,
              phonetic: vocab.phonetic,
            },
          });
        }
      }
    }

    res.json({
      isDuplicate: duplicates.length > 0,
      duplicates,
    });
  } catch (error) {
    console.error('Check duplicate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Batch check duplicates for multiple vocabulary items
router.post('/check-duplicates-batch', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { vocabularies } = req.body;

    if (!Array.isArray(vocabularies)) {
      return res.status(400).json({ error: 'vocabularies must be an array' });
    }

    // Get user's notebook data
    const result = await pool.query(
      `SELECT data_value FROM user_data 
       WHERE user_id = $1 AND data_key = $2`,
      [userId, 'flashcash-notebooks']
    );

    if (result.rows.length === 0) {
      return res.json({ results: vocabularies.map(() => ({ isDuplicate: false, duplicates: [] })) });
    }

    const notebooksData = result.rows[0].data_value;
    const notebooks = notebooksData?.notebooks || [];

    const results = vocabularies.map((vocab) => {
      const { kanji, hiragana } = vocab;

      if (!kanji?.trim() || !hiragana?.trim()) {
        return { isDuplicate: false, duplicates: [] };
      }

      const duplicates: Array<{
        notebookId: string;
        notebookName: string;
        vocab: any;
      }> = [];

      const normalizedKanji = kanji.trim();
      const normalizedHiragana = hiragana.trim();

      // Search across all notebooks for duplicates
      for (const nb of notebooks) {
        if (!nb.vocabulary || !Array.isArray(nb.vocabulary)) continue;

        for (const existingVocab of nb.vocabulary) {
          const kanjiMatch = existingVocab.kanji?.trim() === normalizedKanji;
          const hiraganaMatch = existingVocab.hiragana?.trim() === normalizedHiragana;

          if (kanjiMatch && hiraganaMatch) {
            duplicates.push({
              notebookId: nb.id,
              notebookName: nb.name,
              vocab: {
                id: existingVocab.id,
                kanji: existingVocab.kanji,
                hiragana: existingVocab.hiragana,
                meaning: existingVocab.meaning,
                onyomi: existingVocab.onyomi,
                phonetic: existingVocab.phonetic,
              },
            });
          }
        }
      }

      return {
        isDuplicate: duplicates.length > 0,
        duplicates,
      };
    });

    res.json({ results });
  } catch (error) {
    console.error('Batch check duplicate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
