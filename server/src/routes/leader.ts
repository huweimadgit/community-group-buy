import express from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = express.Router();

router.use(requireAuth, requireRole('leader'));

// 查当前团长负责的社区
async function getMyCommunity(userId: number): Promise<{ id: number; name: string } | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name FROM communities WHERE leader_id = ? LIMIT 1`,
    [userId],
  );
  if (rows.length === 0) return null;
  return { id: rows[0].id as number, name: rows[0].name as string };
}

// ============================================================
// GET /api/leader/community — 我负责的社区
// ============================================================
router.get('/community', async (req, res) => {
  try {
    const community = await getMyCommunity(req.user!.id);
    if (!community) return res.fail('你不是任何社区的团长', 403, 403);
    res.success(community);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('查询社区失败: ' + msg);
    res.fail('查询失败', 1, 500);
  }
});

// ============================================================
// GET /api/leader/orders — 本团订单
// ?status=&page=&size=
// ============================================================
router.get('/orders', async (req, res) => {
  const community = await getMyCommunity(req.user!.id);
  if (!community) return res.fail('你不是任何社区的团长', 403, 403);

  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.max(50, Math.max(1, Number(req.query.size) || 10));
  const offset = (page - 1) * size;
  const status = typeof req.query.status === 'string' ? req.query.status : '';

  const conditions = ['o.community_id = ?'];
  const params: unknown[] = [community.id];
  if (status) {
    conditions.push('o.status = ?');
    params.push(status);
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT o.*, u.username
       FROM orders o
       JOIN users u ON u.id = o.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, size, offset],
    );

    const orderIds = rows.map((r) => r.id);
    let itemsByOrder: Record<number, RowDataPacket[]> = {};
    if (orderIds.length > 0) {
      const [items] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM order_items WHERE order_id IN (?)`,
        [orderIds],
      );
      itemsByOrder = items.reduce<Record<number, RowDataPacket[]>>((acc, it) => {
        const oid = it.order_id as number;
        if (!acc[oid]) acc[oid] = [];
        acc[oid].push(it);
        return acc;
      }, {});
    }

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM orders o WHERE ${conditions.join(' AND ')}`,
      params,
    );

    res.success({
      community,
      list: rows.map((r) => ({ ...r, items: itemsByOrder[r.id as number] || [] })),
      pagination: {
        page,
        size,
        total: Number(countRows[0].total),
        totalPages: Math.ceil(Number(countRows[0].total) / size),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('查询本团订单失败: ' + msg);
    res.fail('查询失败', 1, 500);
  }
});

// ============================================================
// GET /api/leader/products — 本团商品（含库存，本团价）
// ============================================================
router.get('/products', async (req, res) => {
  const community = await getMyCommunity(req.user!.id);
  if (!community) return res.fail('你不是任何社团的团长', 403, 403);

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT cp.id AS cp_id, cp.stock, cp.price AS community_price,
              p.id AS product_id, p.name, p.cover_url, p.unit, p.status, p.price AS base_price,
              c.name AS category_name
       FROM community_products cp
       JOIN products p ON p.id = cp.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE cp.community_id = ?
       ORDER BY cp.updated_at DESC`,
      [community.id],
    );
    res.success({ community, list: rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('查询本团商品失败: ' + msg);
    res.fail('查询失败', 1, 500);
  }
});

// ============================================================
// PUT /api/leader/products/:cpId — 修改本团商品的库存/价格
// body: { stock?, price? }
// ============================================================
router.put('/products/:cpId', async (req, res) => {
  const community = await getMyCommunity(req.user!.id);
  if (!community) return res.fail('你不是任何社团的团长', 403, 403);

  const cpId = Number(req.params.cpId);
  console.log(cpId);
  if (!Number.isInteger(cpId) || cpId <= 0) return res.fail('ID 无效', 400, 400);

  const { stock, price } = req.body as { stock?: unknown; price?: unknown };
  const fields: string[] = [];
  const params: unknown[] = [];

  if (typeof stock === 'number' && Number.isInteger(stock) && stock >= 0) {
    fields.push('stock = ?');
    params.push(stock);
  }
  if (typeof price === 'number' && price >= 0) {
    fields.push('price = ?');
    params.push(price);
  }
  if (fields.length === 0) return res.fail('没有需要更新的字段', 400, 400);

  params.push(cpId, community.id);
  try {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE community_products SET ${fields.join(', ')}
       WHERE id = ? AND community_id = ?`,
      params,
    );
    if (result.affectedRows === 0) {
      return res.fail('商品不存在或不属于你的社团', 404, 404);
    }
    res.success(null, '更新成功');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('更新本团商品失败: ' + msg);
    res.fail('更新失败', 1, 500);
  }
});

// ============================================================
// GET /api/leader/stats — 本团数据统计
// ============================================================
router.get('/stats', async (req, res) => {
  const community = await getMyCommunity(req.user!.id);
  if (!community) return res.fail('你不是任何社团的团长', 403, 403);

  try {
    const [orderStats] = await pool.query<RowDataPacket[]>(
      `SELECT
        COUNT(*) AS total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN status IN ('paid', 'shipped', 'completed') THEN total_amount ELSE 0 END) AS total_sales
        FROM orders WHERE community_id = ?`,
      [community.id],
    );

    const [todayStats] = await pool.query<RowDataPacket[]>(
      `SELECT
        COUNT(*) AS today_orders,
        SUM(CASE WHEN status IN ('paid', 'shipped', 'completed') THEN total_amount ELSE 0 END) AS today_sales
        FROM orders
        WHERE community_id = ? AND DATE(created_at) = CURDATE()`,
      [community.id],
    );

    res.success({
      community,
      order_stats: orderStats[0],
      today_stats: todayStats[0],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('查询本团统计失败: ' + msg);
    res.fail('查询失败', 1, 500);
  }
});

export default router;
