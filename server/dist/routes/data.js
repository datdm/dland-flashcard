"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get notebooks data
router.get('/notebooks', auth_1.authenticate, async (req, res) => {
    try {
        const result = await db_1.default.query(`SELECT data_value FROM user_data 
       WHERE user_id = $1 AND data_key = $2`, [req.userId, 'flashcash-notebooks']);
        const notebooks = result.rows[0]?.data_value || [];
        res.json({
            success: true,
            data: notebooks,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Get notebooks error:', error);
        res.status(500).json({ error: 'Failed to load notebooks' });
    }
});
// Get curriculums data
router.get('/curriculums', auth_1.authenticate, async (req, res) => {
    try {
        const result = await db_1.default.query(`SELECT data_value FROM user_data 
       WHERE user_id = $1 AND data_key = $2`, [req.userId, 'flashcash-curriculums']);
        const curriculums = result.rows[0]?.data_value || [];
        res.json({
            success: true,
            data: curriculums,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Get curriculums error:', error);
        res.status(500).json({ error: 'Failed to load curriculums' });
    }
});
// Get grammar collections data
router.get('/grammar-collections', auth_1.authenticate, async (req, res) => {
    try {
        const result = await db_1.default.query(`SELECT data_value FROM user_data 
       WHERE user_id = $1 AND data_key = $2`, [req.userId, 'flashcash-grammar-collections']);
        const collections = result.rows[0]?.data_value || [];
        res.json({
            success: true,
            data: collections,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Get grammar collections error:', error);
        res.status(500).json({ error: 'Failed to load grammar collections' });
    }
});
// Get progress data (vocabulary + grammar)
router.get('/progress', auth_1.authenticate, async (req, res) => {
    try {
        const vocabResult = await db_1.default.query(`SELECT data_value FROM user_data 
       WHERE user_id = $1 AND data_key = $2`, [req.userId, 'flashcash-progress']);
        const grammarResult = await db_1.default.query(`SELECT data_value FROM user_data 
       WHERE user_id = $1 AND data_key = $2`, [req.userId, 'flashcash-grammar-progress']);
        res.json({
            success: true,
            data: {
                vocabulary: vocabResult.rows[0]?.data_value || {},
                grammar: grammarResult.rows[0]?.data_value || {},
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: 'Failed to load progress' });
    }
});
// Get settings data
router.get('/settings', auth_1.authenticate, async (req, res) => {
    try {
        const result = await db_1.default.query(`SELECT data_value FROM user_data 
       WHERE user_id = $1 AND data_key = $2`, [req.userId, 'flashcash-settings']);
        const settings = result.rows[0]?.data_value || {};
        res.json({
            success: true,
            data: settings,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to load settings' });
    }
});
// PATCH /progress/:vocabId – delta update a single vocab's progress (learned/favorite)
router.patch('/progress/:vocabId', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const { vocabId } = req.params;
        const patch = req.body; // e.g. { learned: true, learnedAt: "...", favorite: false }
        if (!patch || typeof patch !== 'object') {
            return res.status(400).json({ error: 'Thiếu dữ liệu patch' });
        }
        // Only allow safe progress fields
        const allowedFields = ['learned', 'learnedAt', 'favorite'];
        const safePatch = {};
        for (const field of allowedFields) {
            if (field in patch)
                safePatch[field] = patch[field];
        }
        if (Object.keys(safePatch).length === 0) {
            return res.status(400).json({ error: 'Không có trường hợp lệ để cập nhật' });
        }
        // Read existing progress
        const result = await db_1.default.query(`SELECT data_value FROM user_data WHERE user_id = $1 AND data_key = $2`, [userId, 'flashcash-progress']);
        const existingProgress = result.rows[0]?.data_value || {};
        // Merge patch into specific vocab entry
        existingProgress[vocabId] = {
            learned: false,
            favorite: false,
            ...(existingProgress[vocabId] || {}),
            ...safePatch,
        };
        // Save back
        await db_1.default.query(`INSERT INTO user_data (user_id, data_key, data_value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, data_key)
       DO UPDATE SET data_value = $3, updated_at = NOW()`, [userId, 'flashcash-progress', JSON.stringify(existingProgress)]);
        await db_1.default.query('UPDATE users SET last_sync_at = NOW() WHERE id = $1', [userId]);
        res.json({ success: true, entry: existingProgress[vocabId] });
    }
    catch (error) {
        console.error('Patch progress error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
