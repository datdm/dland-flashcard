import { Response, NextFunction } from 'express';
import pool from '../db';
import { AuthRequest } from './auth';

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Không có quyền truy cập. Vui lòng đăng nhập.' });
  }

  try {
    const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.userId]);
    const user = result.rows[0];

    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Truy cập bị từ chối. Chỉ dành cho Admin.' });
    }

    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi xác thực quyền admin.' });
  }
};
