"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const db_1 = __importDefault(require("../db"));
const requireAdmin = async (req, res, next) => {
    if (!req.userId) {
        return res.status(401).json({ error: 'Không có quyền truy cập. Vui lòng đăng nhập.' });
    }
    try {
        const result = await db_1.default.query('SELECT is_admin FROM users WHERE id = $1', [req.userId]);
        const user = result.rows[0];
        if (!user || !user.is_admin) {
            return res.status(403).json({ error: 'Truy cập bị từ chối. Chỉ dành cho Admin.' });
        }
        next();
    }
    catch (error) {
        console.error('Admin verification error:', error);
        res.status(500).json({ error: 'Lỗi máy chủ khi xác thực quyền admin.' });
    }
};
exports.requireAdmin = requireAdmin;
