"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get backup history for current user
router.get('/history', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const result = await db_1.default.query(`SELECT id, created_at, backup_type, data_keys, note, 
              pg_size_pretty(length(backup_data::text)::bigint) as data_size
       FROM backup_history 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`, [userId]);
        res.json({ backups: result.rows });
    }
    catch (error) {
        console.error('Error fetching backup history:', error);
        res.status(500).json({ error: 'Lỗi khi lấy lịch sử backup' });
    }
});
// Get specific backup data
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const backupId = req.params.id;
        const result = await db_1.default.query(`SELECT id, backup_data, created_at, backup_type, data_keys, note
       FROM backup_history 
       WHERE id = $1 AND user_id = $2`, [backupId, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy backup' });
        }
        res.json({ backup: result.rows[0] });
    }
    catch (error) {
        console.error('Error fetching backup:', error);
        res.status(500).json({ error: 'Lỗi khi lấy backup' });
    }
});
// Create manual backup
router.post('/create', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const { backupData, note } = req.body;
        if (!backupData || typeof backupData !== 'object') {
            return res.status(400).json({ error: 'Thiếu dữ liệu backup' });
        }
        const dataKeys = Object.keys(backupData);
        const result = await db_1.default.query(`INSERT INTO backup_history (user_id, backup_data, backup_type, data_keys, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`, [userId, JSON.stringify(backupData), 'manual', dataKeys, note || null]);
        res.json({
            success: true,
            backup: result.rows[0]
        });
    }
    catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ error: 'Lỗi khi tạo backup' });
    }
});
// Delete backup
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const backupId = req.params.id;
        const result = await db_1.default.query(`DELETE FROM backup_history 
       WHERE id = $1 AND user_id = $2
       RETURNING id`, [backupId, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy backup' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting backup:', error);
        res.status(500).json({ error: 'Lỗi khi xóa backup' });
    }
});
// Restore from backup (replace current user_data with backup data)
router.post('/:id/restore', auth_1.authenticate, async (req, res) => {
    const client = await db_1.default.connect();
    try {
        const userId = req.userId;
        const backupId = req.params.id;
        await client.query('BEGIN');
        // Get backup data
        const backupResult = await client.query(`SELECT backup_data FROM backup_history 
       WHERE id = $1 AND user_id = $2`, [backupId, userId]);
        if (backupResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Không tìm thấy backup' });
        }
        const backupData = backupResult.rows[0].backup_data;
        // Delete current user_data
        await client.query('DELETE FROM user_data WHERE user_id = $1', [userId]);
        // Insert backup data
        for (const [key, value] of Object.entries(backupData)) {
            await client.query(`INSERT INTO user_data (user_id, data_key, data_value, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`, [userId, key, JSON.stringify(value)]);
        }
        // Update last_sync_at
        await client.query('UPDATE users SET last_sync_at = CURRENT_TIMESTAMP WHERE id = $1', [userId]);
        await client.query('COMMIT');
        res.json({ success: true, message: 'Đã khôi phục dữ liệu từ backup' });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Error restoring backup:', error);
        res.status(500).json({ error: 'Lỗi khi khôi phục backup' });
    }
    finally {
        client.release();
    }
});
// Delete all backups for current user
router.delete('/all', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const result = await db_1.default.query(`DELETE FROM backup_history 
       WHERE user_id = $1
       RETURNING id`, [userId]);
        res.json({
            success: true,
            deletedCount: result.rows.length,
            message: `Đã xóa ${result.rows.length} backup`
        });
    }
    catch (error) {
        console.error('Error deleting all backups:', error);
        res.status(500).json({ error: 'Lỗi khi xóa tất cả backup' });
    }
});
exports.default = router;
