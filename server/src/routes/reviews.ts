import express from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// ============================================================
// POST /api/reviews — 创建评价
// body: { order_item_id, rating, content?, images?, video_url? }
// ============================================================
router.post('/', requireAuth, async (req, res) => {
  const { order_item_id, rating, content, images, video_url } = req.body as {
    order_item_id?: unknown;
    rating?: unknown;
    content?: unknown;
    images?: unknown;
    video_url?: unknown;
  };

  const itemId = Number(order_item_id);
  const ratingNum = Number(rating);

  if (!Number.isInteger(itemId) || itemId <= 0) return res.fail('订单项 ID 无效', 400, 400);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.fail('评分必须是 1-5', 400, 400);
  }
  if (content !== undefined && typeof content !== 'string') {
    return res.fail('评价内容格式错误', 400, 400);
  }
  if (images !== undefined && !Array.isArray(images)) {
    return res.fail('图片格式错误', 400, 400);
  }
  if (video_url !== undefined && video_url !== null && typeof video_url !== 'string') {
    return res.fail('视频 URL 格式错误', 400, 400);
  }

  try {
    // 校验订单项归属：必须是当前用户的订单，且订单已完成
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT oi.id, o.user_id, o.status
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.id = ?`,
      [itemId],
    );
    if (rows.length === 0) return res.fail('订单项不存在', 404, 404);
    if (rows[0].user_id !== req.user!.id) return res.fail('无权评价此订单项', 403, 403);
    if (rows[0].status !== 'completed') {
      return res.fail('只有已完成的订单才能评价', 400, 400);
    }

    // 检查是否已评价（表上有 UNIQUE 约束）
    const [exist] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM reviews WHERE order_item_id = ?`,
      [itemId],
    );
    if (exist.length > 0) return res.fail('该商品已评价过', 400, 400);

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO reviews (user_id, order_item_id, rating, content, images, video_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user!.id,
        itemId,
        ratingNum,
        typeof content === 'string' && content.trim() ? content.trim() : null,
        images && Array.isArray(images) ? JSON.stringify(images) : null,
        typeof video_url === 'string' && video_url ? video_url : null,
      ],
    );

    res.success({ id: result.insertId }, '评价成功');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('创建评价失败: ' + msg);
    res.fail('评价失败', 1, 500);
  }
});

// ============================================================
// GET /api/reviews/my — 我的所有评价（用于"待评价"判断）
// ============================================================
router.get('/my', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.*, oi.product_name
       FROM reviews r
       JOIN order_items oi ON oi.id = r.order_item_id
       WHERE r.user_id = ?`,
      [req.user!.id],
    );
    res.success(rows);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('查询我的评价失败: ' + msg);
    res.fail('查询失败', 1, 500);
  }
});

export default router;

// ============================================================
// 单独导出商品评价查询（挂到 products 路由下用）
// ============================================================
export const getProductReviews = async (req: express.Request, res: express.Response) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.fail('商品 ID 无效', 400, 400);
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.max(20, Math.max(1, Number(req.query.size) || 10));
  const offset = (page - 1) * size;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.rating, r.content, r.images, r.video_url, r.created_at,
              u.username, u.avatar,
              oi.product_id
        FROM reviews r
        JOIN order_items oi ON oi.id = r.order_item_id
        JOIN users u ON u.id = r.user_id
        WHERE oi.product_id = ?
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?`,
      [productId, size, offset],
    );
    // images 字段从 JSON 字符串转回数组
    const list = rows.map((r) => ({
      ...r,
      images: typeof r.images === 'string' ? JSON.parse(r.images as string) : r.images || [],
    }));

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM reviews r
       JOIN order_items oi ON oi.id = r.order_item_id
       WHERE oi.product_id = ?`,
      [productId],
    );

    // 评价评分
    const [avgRows] = await pool.query<RowDataPacket[]>(
      `SELECT AVG(r.rating) AS avg_rating
       FROM reviews r
       JOIN order_items oi ON oi.id = r.order_item_id
       WHERE oi.product_id = ?`,
      [productId],
    );

    res.success({
      list,
      pagination: {
        page,
        size,
        total: Number(countRows[0].total),
        totalPages: Math.ceil(Number(countRows[0].total) / size),
      },
      avg_rating: avgRows[0].avg_rating ? Number(avgRows[0].avg_rating).toFixed(1) : null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('查询商品评价失败: ' + msg);
    res.fail('查询失败' + msg, 1, 500);
  }
};
