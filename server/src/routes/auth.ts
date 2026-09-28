import express from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken, type UserRole } from '../utils/jwt.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  status: 'active' | 'banned';
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password, phone } = req.body as {
    username?: unknown;
    password?: unknown;
    phone?: unknown;
  };

  if (typeof username !== 'string' || username.length < 3 || username.length > 50) {
    return res.fail('用户名长度需在 3-50 字符之间', 400, 400);
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.fail('密码至少 6 位', 400, 400);
  }
  if (phone !== undefined && typeof phone !== 'string') {
    return res.fail('手机号格式错误', 400, 400);
  }

  try {
    const [existing] = await pool.query<UserRow[]>('SELECT id FROM users WHERE username = ?', [
      username,
    ]);
    if (existing.length > 0) {
      return res.fail('用户名已存在', 400, 400);
    }

    const hash = hashPassword(password);
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (username, password_hash, phone, role) VALUES (?, ?, ?, ?)',
      [username, hash, phone ?? null, 'user'],
    );

    const user = { id: result.insertId, username, role: 'user' as const };
    const token = signToken(user);
    res.success({ token, user }, '注册成功');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('注册失败: ' + msg);
    res.fail('注册失败，请稍后重试', 1, 500);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body as {
    username?: unknown;
    password?: unknown;
  };

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.fail('用户名和密码不能为空', 400, 400);
  }

  try {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, username, password_hash, role, status FROM users WHERE username = ?',
      [username],
    );
    if (rows.length === 0) {
      return res.fail('用户名或密码错误', 401, 401);
    }

    const u = rows[0];
    if (u.status === 'banned') {
      return res.fail('账号已被封禁', 403, 403);
    }
    if (!comparePassword(password, u.password_hash)) {
      return res.fail('用户名或密码错误', 401, 401);
    }

    const user = { id: u.id, username: u.username, role: u.role };
    const token = signToken(user);
    res.success({ token, user }, '登录成功');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('登录失败: ' + msg);
    res.fail('登录失败，请稍后重试', 1, 500);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, username, phone, avatar, role FROM users WHERE id = ?',
      [req.user!.id],
    );
    if (rows.length === 0) {
      return res.fail('用户不存在', 404, 404);
    }
    const u = rows[0];
    res.success({
      id: u.id,
      username: u.username,
      phone: u.phone,
      avatar: u.avatar,
      role: u.role,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('获取用户信息失败: ' + msg);
    res.fail('获取用户信息失败', 1, 500);
  }
});

export default router;
