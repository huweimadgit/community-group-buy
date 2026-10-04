import express from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { getProductReviews } from './reviews.js';

const router = express.Router();

interface ProductRow extends RowDataPacket {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  cover_url: string | null;
  video_url: string | null;
  price: string; // DECIMAL 查询返回字符串
  unit: string;
  status: 'on' | 'off';
  created_at: string;
  category_name?: string;
  stock?: number | null;
  community_price?: string | null;
}

// GET /api/products — 公开
// 支持 ?category_id= &keyword= &community_id= &page= &size=
router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.min(50, Math.max(1, Number(req.query.size) || 10));
  const offset = (page - 1) * size;

  const categoryId = req.query.category_id ? Number(req.query.category_id) : null;
  const communityId = req.query.community_id ? Number(req.query.community_id) : null;
  const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : '';

  const conditions: string[] = [`p.status = 'on'`];
  const params: unknown[] = [];

  if (categoryId && Number.isInteger(categoryId)) {
    conditions.push('p.category_id = ?');
    params.push(categoryId);
  }
  if (keyword) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const where = conditions.join(' AND ');

  // 拼接 community 关联（可选）
  const communityJoin = communityId
    ? 'LEFT JOIN community_products cp ON cp.product_id = p.id AND cp.community_id = ?'
    : '';
  const communityFields = communityId ? ', cp.stock, cp.price AS community_price' : '';
  const joinParams = communityId ? [communityId] : [];

  try {
    const [rows] = await pool.query<ProductRow[]>(
      `SELECT p.id, p.category_id, p.name, p.description, p.cover_url, p.video_url,
              p.price, p.unit, p.status, p.created_at,
              c.name AS category_name${communityFields}
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${communityJoin}
       WHERE ${where}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...joinParams, ...params, size, offset],
    );

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM products p WHERE ${where}`,
      params,
    );
    const total = Number(countRows[0].total);

    res.success({
      list: rows,
      pagination: { page, size, total, totalPages: Math.ceil(total / size) },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('查询商品失败: ' + msg);
    res.fail('查询商品失败', 1, 500);
  }
});

router.get('/:id/reviews', getProductReviews);

// GET /api/products/:id — 公开
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.fail('商品 ID 无效', 400, 400);
  }
  try {
    const [rows] = await pool.query<ProductRow[]>(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`,
      [id],
    );
    if (rows.length === 0) {
      return res.fail('商品不存在', 404, 404);
    }
    res.success(rows[0]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('查询商品详情失败: ' + msg);
    res.fail('查询失败', 1, 500);
  }
});

// POST /api/products — leader/admin
router.post('/', requireAuth, requireRole('admin', 'leader'), async (req, res) => {
  const { category_id, name, description, cover_url, video_url, price, unit } = req.body as {
    category_id?: unknown;
    name?: unknown;
    description?: unknown;
    cover_url?: unknown;
    video_url?: unknown;
    price?: unknown;
    unit?: unknown;
  };

  if (typeof category_id !== 'number') return res.fail('分类 ID 必填', 400, 400);
  if (typeof name !== 'string' || name.length === 0 || name.length > 100) {
    return res.fail('商品名长度需在 1-100 之间', 400, 400);
  }
  if (typeof price !== 'number' || price <= 0) return res.fail('价格必须大于 0', 400, 400);
  if (typeof unit !== 'string' || unit.length === 0) return res.fail('单位必填', 400, 400);

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO products (category_id, name, description, cover_url, video_url, price, unit)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id,
        name,
        typeof description === 'string' ? description : null,
        typeof cover_url === 'string' ? cover_url : null,
        typeof video_url === 'string' ? video_url : null,
        price,
        unit,
      ],
    );
    res.success({ id: result.insertId }, '创建成功');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('创建商品失败: ' + msg);
    res.fail('创建商品失败', 1, 500);
  }
});

// PUT /api/products/:id — leader/admin
router.put('/:id', requireAuth, requireRole('admin', 'leader'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.fail('商品 ID 无效', 400, 400);

  const allowed = [
    'category_id',
    'name',
    'description',
    'cover_url',
    'video_url',
    'price',
    'unit',
    'status',
  ];
  const fields: string[] = [];
  const params: unknown[] = [];

  for (const key of allowed) {
    if (key in req.body) {
      fields.push(`${key} = ?`);
      params.push((req.body as Record<string, unknown>)[key]);
    }
  }
  if (fields.length === 0) return res.fail('没有需要更新的字段', 400, 400);

  params.push(id);
  try {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      params,
    );
    if (result.affectedRows === 0) return res.fail('商品不存在', 404, 404);
    res.success(null, '更新成功');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('更新商品失败: ' + msg);
    res.fail('更新商品失败', 1, 500);
  }
});

// DELETE /api/products/:id — 仅 admin
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.fail('商品 ID 无效', 400, 400);

  try {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.fail('商品不存在', 404, 404);
    res.success(null, '删除成功');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('删除商品失败: ' + msg);
    res.fail('删除失败：该商品可能已被订单引用', 1, 500);
  }
});

export default router;
