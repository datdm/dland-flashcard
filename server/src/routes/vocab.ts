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

// Single vocabulary upload route (checks duplicate across all notebooks and appends to database)
router.post('/upload', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id, kanji, hiragana, meaning, onyomi, phonetic, notebookId } = req.body;

    if (!notebookId) {
      return res.status(400).json({ error: 'Thiếu notebookId' });
    }

    const normalizedKanji = (kanji || '').trim();
    const normalizedHiragana = (hiragana || '').trim();

    if (!normalizedKanji && !normalizedHiragana) {
      return res.status(400).json({ error: 'Từ vựng phải có ít nhất Kanji hoặc Hiragana/Katakana' });
    }

    // 1. Fetch current notebooks from database
    const result = await pool.query(
      `SELECT data_value FROM user_data 
       WHERE user_id = $1 AND data_key = $2`,
      [userId, 'flashcash-notebooks']
    );

    let notebooks: any[] = [];
    if (result.rows.length > 0 && result.rows[0].data_value) {
      notebooks = result.rows[0].data_value.notebooks || [];
    }

    // 2. Check if notebookId exists in notebooks
    const targetNotebook = notebooks.find((nb) => nb.id === notebookId);
    if (!targetNotebook) {
      return res.status(404).json({ error: 'Không tìm thấy sổ tay được chọn' });
    }

    // 3. Check duplicate across ALL notebooks
    let duplicateFound = null;
    for (const nb of notebooks) {
      if (!nb.vocabulary || !Array.isArray(nb.vocabulary)) continue;

      const dup = nb.vocabulary.find((v: any) => {
        const vKanji = (v.kanji || '').trim();
        const vHiragana = (v.hiragana || '').trim();

        if (normalizedKanji && vKanji) {
          return vKanji === normalizedKanji && vHiragana === normalizedHiragana;
        } else {
          return vHiragana === normalizedHiragana;
        }
      });

      if (dup) {
        duplicateFound = {
          notebookName: nb.name,
          vocab: dup,
        };
        break;
      }
    }

    if (duplicateFound) {
      return res.status(400).json({
        error: `Từ vựng "${normalizedKanji} (${normalizedHiragana})" đã tồn tại trong sổ tay "${duplicateFound.notebookName}"!`
      });
    }

    // 4. Create and append new vocabulary
    const newVocab = {
      id: id || `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kanji: normalizedKanji,
      hiragana: normalizedHiragana,
      meaning: meaning?.trim() || '',
      onyomi: onyomi?.trim() || '',
      phonetic: phonetic?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    if (!targetNotebook.vocabulary) {
      targetNotebook.vocabulary = [];
    }
    targetNotebook.vocabulary.unshift(newVocab);

    // 5. Update user_data back to database
    await pool.query(
      `INSERT INTO user_data (user_id, data_key, data_value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, data_key)
       DO UPDATE SET data_value = $3, updated_at = NOW()`,
      [userId, 'flashcash-notebooks', JSON.stringify({ notebooks })]
    );

    // Update last sync time
    await pool.query(
      'UPDATE users SET last_sync_at = NOW() WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'Upload từ vựng thành công',
      vocab: newVocab,
    });
  } catch (error) {
    console.error('Upload vocabulary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a vocabulary item from a notebook (delta operation)
router.delete('/:vocabId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { vocabId } = req.params;
    const { notebookId } = req.body;

    if (!notebookId) {
      return res.status(400).json({ error: 'Thiếu notebookId' });
    }

    const result = await pool.query(
      `SELECT data_value FROM user_data WHERE user_id = $1 AND data_key = $2`,
      [userId, 'flashcash-notebooks']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy dữ liệu sổ tay' });
    }

    let notebooks: any[] = result.rows[0].data_value?.notebooks || [];
    const targetNb = notebooks.find((nb: any) => nb.id === notebookId);
    if (!targetNb) {
      return res.status(404).json({ error: 'Không tìm thấy sổ tay được chọn' });
    }

    const before = targetNb.vocabulary?.length || 0;
    targetNb.vocabulary = (targetNb.vocabulary || []).filter((v: any) => v.id !== vocabId);
    const after = targetNb.vocabulary.length;

    if (before === after) {
      return res.status(404).json({ error: 'Không tìm thấy từ vựng để xóa' });
    }

    await pool.query(
      `INSERT INTO user_data (user_id, data_key, data_value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, data_key)
       DO UPDATE SET data_value = $3, updated_at = NOW()`,
      [userId, 'flashcash-notebooks', JSON.stringify({ notebooks })]
    );

    await pool.query('UPDATE users SET last_sync_at = NOW() WHERE id = $1', [userId]);

    res.json({ success: true, message: 'Xóa từ vựng thành công' });
  } catch (error) {
    console.error('Delete vocab error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update (patch) a vocabulary item in a notebook (delta operation – used for favorite, edit)
router.patch('/:vocabId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { vocabId } = req.params;
    const { notebookId, patch } = req.body;

    if (!notebookId || !patch || typeof patch !== 'object') {
      return res.status(400).json({ error: 'Thiếu notebookId hoặc patch' });
    }

    const result = await pool.query(
      `SELECT data_value FROM user_data WHERE user_id = $1 AND data_key = $2`,
      [userId, 'flashcash-notebooks']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy dữ liệu sổ tay' });
    }

    let notebooks: any[] = result.rows[0].data_value?.notebooks || [];
    const targetNb = notebooks.find((nb: any) => nb.id === notebookId);
    if (!targetNb) {
      return res.status(404).json({ error: 'Không tìm thấy sổ tay được chọn' });
    }

    const vocabIndex = (targetNb.vocabulary || []).findIndex((v: any) => v.id === vocabId);
    if (vocabIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy từ vựng' });
    }

    // Apply patch (only allow safe fields: no id changes)
    const allowedPatchFields = ['kanji', 'hiragana', 'meaning', 'onyomi', 'phonetic', 'isFavorite', 'note'];
    const safePatch: any = {};
    for (const field of allowedPatchFields) {
      if (field in patch) safePatch[field] = patch[field];
    }

    targetNb.vocabulary[vocabIndex] = { ...targetNb.vocabulary[vocabIndex], ...safePatch };

    await pool.query(
      `INSERT INTO user_data (user_id, data_key, data_value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, data_key)
       DO UPDATE SET data_value = $3, updated_at = NOW()`,
      [userId, 'flashcash-notebooks', JSON.stringify({ notebooks })]
    );

    await pool.query('UPDATE users SET last_sync_at = NOW() WHERE id = $1', [userId]);

    res.json({ success: true, vocab: targetNb.vocabulary[vocabIndex] });
  } catch (error) {
    console.error('Patch vocab error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
