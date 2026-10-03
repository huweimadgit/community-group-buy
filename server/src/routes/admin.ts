import express from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

// ============================================================
// GET /api/admin/users — 用户列表
// ?role=&page=&sieze=
// ============================================================
router.get('/users', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.max(50, Math.max(1, Number(req.query.size) || 10));
  const offset = (page - 1) * size;
  const role = typeof req.query.role === 'string' ? req.query.role : '';

  const conditions: string[] = [];
  const params: unknown[] = [];
  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }
  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, phone, avatar, role, status, created_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, size, offset],
    );

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM users ${where}`,
      params,
    );

    res.success({
      list: rows,
      pagination: {
        page,
        size,
        total: Number(countRows[0].total),
        totalPages: Math.ceil(Number(countRows[0].total) / size),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('查询用户失败: ' + msg);
    res.fail('查询失败', 1, 500);
  }
});

// ============================================================
// PUT /api/admin/users/:id/status — 封禁/解封
// body: { status: 'active' | 'banned' }
// ============================================================
router.put('/users/:id/status', async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status?: unknown };
  if (!Number.isInteger(id) || id <= 0) return res.fail('ID 无效', 400, 400);
  if (status !== 'active' && status !== 'banned') {
    return res.fail('status 必须是 active 或 banned', 400, 400);
  }
  if (id === req.user!.id) return res.fail('不能封禁自己', 400, 400);

  try {
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    res.success(null, '更新成功');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('更新用户状态失败: ' + msg);
    res.fail('更新失败', 1, 500);
  }
});

// ============================================================
// GET /api/admin/users/orders — 全局订单
// ============================================================
router.get('/orders', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.max(50, Math.max(1, Number(req.query.size) || 10));
  const offset = (page - 1) * size;
  const status = typeof req.query.status === 'string' ? req.query.status : '';

  const conditions: string[] = [];
  const params: unknown[] = [];
  if (status) {
    conditions.push('o.status = ?');
    params.push(status);
  }
  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT o.*, u.username, com.name AS community_name
       FROM orders o
       JOIN users u ON u.id = o.user_id
       JOIN communities com ON com.id = o.community_id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, size, offset],
    );

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM orders o ${where}`,
      params,
    );

    res.success({
      list: rows,
      pagination: {
        page,
        size,
        total: Number(countRows[0].total),
        totalPages: Math.ceil(Number(countRows[0].total) / size),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('查询全局订单失败: ' + msg);
    res.fail('查询失败', 1, 500);
  }
});

// ============================================================
// GET /api/admin/stats/overview — 全局总览
// ============================================================
router.get('/stats/overview', async (_req, res) => {
  try {
    const [userCount] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM users WHERE role = 'user'`,
    );
    const [orderStats] = await pool.query<RowDataPacket[]>(
      `SELECT
        COUNT(*) AS total_orders,
        SUM(CASE WHEN status IN ('paid', 'shipped', 'completed') THEN total_amount ELSE 0 END) AS total_sales,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_orders
        FROM orders`,
    );
    const [productCount] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM products WHERE status = 'on'`,
    );
    const [communityCount] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM communities WHERE status = 'active'`,
    );

    res.success({
      user_count: Number(userCount[0].c),
      product_count: Number(productCount[0].c),
      community_count: Number(communityCount[0].c),
      total_orders: Number(orderStats[0].total_orders),
      total_sales: orderStats[0].total_sales ?? '0.00',
      pending_orders: Number(orderStats[0].pending_orders),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('查询总览失败: ' + msg);
    res.fail('查询失败', 1, 500);
  }
});

// ============================================================
// GET /api/admin/stats/sales-trend?days=7 — 近 N 天销售趋势
// ============================================================
router.get('/stats/sales-trend', async (req, res) => {
  const days = Math.min(30, Math.max(1, Number(req.query.days) || 7));

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        DATE(created_at) AS date,
        COUNT(*) AS order_count,
        SUM(CASE WHEN status IN ('paid', 'shipped', 'completed') THEN total_amount ELSE 0 END) AS sales
        FROM orders
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC`,
      [days],
    );

    // 补齐没有订单的日期（图标更美观）
    const result: { date: string; order_count: number; sales: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const found = rows.find((r) => String(r.date).slice(0, 10) === dateStr);
      result.push({
        date: dateStr,
        order_count: found ? Number(found.order_count) : 0,
        sales: found ? Number(found.sales) : 0,
      });
    }

    res.success(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('查询销售趋势失败: ' + msg);
    res.fail('查询失败' + msg, 1, 500);
  }
});

// ============================================================
// GET /api/admin/stats/top-products?limit=10 — 热销 Top N
// ============================================================
router.get('/stats/top-products', async (req, res) => {
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 10));

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        oi.product_id,
        oi.product_name,
        SUM(oi.quantity) AS total_quantity,
        SUM(oi.subtotal) AS total_sales
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status IN ('paid', 'shipped', 'completed')
       GROUP BY oi.product_id, oi.product_name
       ORDER BY total_quantity DESC
       LIMIT ?`,
      [limit],
    );

    res.success(
      rows.map((r) => ({
        product_id: r.product_id,
        product_name: r.product_name,
        total_quantity: Number(r.total_quantity),
        total_sales: Number(r.total_sales),
      })),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('查询热销商品失败: ' + msg);
    res.fail('查询失败', 1, 500);
  }
});

// ============================================================
// GET /api/admin/stats/orders-status — 订单状态分布
// ============================================================
router.get('/stats/order-status', async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) AS count FROM orders GROUP BY status`,
    );
    res.success(rows.map((r) => ({ status: r.status, count: Number(r.count) })));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('查询订单状态分布情况失败: ' + msg);
    res.fail('查询失败', 1, 500);
  }
});

export default router;
