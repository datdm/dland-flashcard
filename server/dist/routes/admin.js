"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const adminAuth_1 = require("../middleware/adminAuth");
const router = express_1.default.Router();
// GET /api/admin/users - Get all users with stats
router.get('/users', auth_1.authenticate, adminAuth_1.requireAdmin, async (req, res) => {
    try {
        const result = await db_1.default.query(`SELECT 
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
      ORDER BY u.created_at DESC`);
        const users = result.rows.map((row) => {
            const settings = row.settings || {};
            const progress = row.progress || {};
            const grammarProgress = row.grammar_progress || {};
            const kanjiProgress = row.kanji_progress || {};
            const notebooksData = row.notebooks || {};
            const notebooksList = Array.isArray(notebooksData.notebooks) ? notebooksData.notebooks : [];
            // Calculate counts
            const vocabLearnedCount = Object.values(progress).filter((p) => p && p.learned).length;
            const grammarLearnedCount = Object.values(grammarProgress).filter((p) => p && p.learned).length;
            const kanjiLearnedCount = Object.values(kanjiProgress).filter((p) => p && p.learned).length;
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
    }
    catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({ error: 'Failed to retrieve users' });
    }
});
// GET /api/admin/users/:userId - Get detailed user study progress
router.get('/users/:userId', auth_1.authenticate, adminAuth_1.requireAdmin, async (req, res) => {
    const { userId } = req.params;
    try {
        // Verify user exists
        const userCheck = await db_1.default.query('SELECT id, username, created_at, last_sync_at, is_admin FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userCheck.rows[0];
        // Fetch all user data keys
        const result = await db_1.default.query('SELECT data_key, data_value FROM user_data WHERE user_id = $1', [userId]);
        const data = {};
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
    }
    catch (error) {
        console.error('Admin get user detail error:', error);
        res.status(500).json({ error: 'Failed to retrieve user details' });
    }
});
exports.default = router;
