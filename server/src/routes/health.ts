import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    res.success({
      status: 'ok',
      db: 'connected',
      time: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.fail('数据库连接失败: ' + message, 1, 500);
  }
});

export default router;
