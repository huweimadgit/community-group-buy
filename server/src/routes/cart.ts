import express from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

interface CartItemRow extends RowDataPacket {
  id: number;
  user_id: number;
  product_id: number;
  community_id: number;
  quantity: number;
  name: string;
  cover_url: string | null;
  unit: string;
  price: string; // 社区价
  stock: number;
  community_name: string;
}

// 所有购物车接口都需要登录
router.use(requireAuth);

// GET /api/cart - 我的购物车
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query<CartItemRow[]>(
      `SELECT c.id, c.user_id, c.product_id, c.community_id, c.quantity,
              p.name, p.cover_url, p.unit,
              cp.price, cp.stock,
              com.name AS community_name
      FROM carts c
      JOIN products p ON p.id = c.product_id
      JOIN community_products cp
        ON cp.product_id = c.product_id AND cp.community_id = c.community_id
      JOIN communities com ON com.id = c.community_id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC`,
      [req.user!.id],
    );

    // 按社区分组（方便前端展示）
    const grouped: Record<
      number,
      { community_id: number; community_name: string; items: CartItemRow[] }
    > = {};
    for (const row of rows) {
      if (!grouped[row.community_id]) {
        grouped[row.community_id] = {
          community_id: row.community_id,
          community_name: row.community_name,
          items: [],
        };
      }
      grouped[row.community_id].items.push(row);
    }

    res.success({
      groups: Object.values(grouped),
      totalItems: rows.reduce((sum, r) => sum + r.quantity, 0),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('查询购物车失败: ' + msg);
    res.fail('查询购物车失败', 1, 500);
  }
});

// POST /api/cart - 加入购物车
// body: { product_id, community_id, quantity }
router.post('/', async (req, res) => {
  const { product_id, community_id, quantity } = req.body as {
    product_id?: unknown;
    community_id?: unknown;
    quantity?: unknown;
  };

  const pid = Number(product_id);
  const cid = Number(community_id);
  const qty = Number(quantity) || 1;

  if (!Number.isInteger(pid) || pid <= 0) return res.fail('商品 ID 无效', 400, 400);
  if (!Number.isInteger(cid) || cid <= 0) return res.fail('社区 ID 无效', 400, 400);
  if (!Number.isInteger(qty) || qty <= 0) return res.fail('数量必须为正整数', 400, 400);

  try {
    // 检查商品是否在该社区上架 + 库存是否足够
    const [cpRows] = await pool.query<RowDataPacket[]>(
      `SELECT stock FROM community_products WHERE product_id = ? AND community_id = ?`,
      [pid, cid],
    );
    if (cpRows.length === 0) {
      return res.fail('该商品在此社区未上架', 400, 400);
    }
    if ((cpRows[0].stock as number) < qty) {
      return res.fail('库存不足', 400, 400);
    }

    // 已存在则累加，否者新增
    await pool.query<ResultSetHeader>(
      `INSERT INTO carts (user_id, product_id, community_id, quantity)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [req.user!.id, pid, cid, qty],
    );

    res.success(null, '已加入购物车');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('加入购物车失败:' + msg);
    res.fail('加入购物车失败', 1, 500);
  }
});

// PUT /api/cat//:id - 修改数量
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { quantity } = req.body as { quantity?: unknown };
  const qty = Number(quantity);

  if (!Number.isInteger(id) || id <= 0) return res.fail('购物车项 ID 无效', 400, 400);
  if (!Number.isInteger(qty) || qty <= 0) return res.fail('数量必须正整数', 400, 400);

  try {
    // 校验：这条记录是不是当前用户的
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.product_id, c.community_id, cp.stock
      FROM carts c
      JOIN community_products cp
        ON cp.product_id = c.product_id AND cp.community_id = c.community_id
      WHERE c.id = ? AND c.user_id = ?`,
      [id, req.user!.id],
    );
    if (rows.length === 0) return res.fail('购物车项不存在', 404, 404);
    if ((rows[0].stock as number) < qty) return res.fail('库存不足', 400, 400);

    await pool.query<ResultSetHeader>(`UPDATE carts SET quantity = ? WHERE id = ?`, [qty, id]);
    res.success(null, '已更新');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('更新购物车失败: ' + msg);
    res.fail('更新购物车失败', 1, 500);
  }
});

// DELETE /api/cart/:id - 删除一项
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.fail('ID 无效', 400, 400);

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM carts WHERE id = ? AND user_id = ?',
      [id, req.user!.id],
    );
    if (result.affectedRows === 0) return res.fail('购物车项不存在', 404, 404);
    res.success(null, '已删除');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('删除购物车项失败: ' + msg);
    res.fail('删除购物车项失败', 1, 500);
  }
});

// DELETE /api/cart - 清空购物车
router.delete('/', async (req, res) => {
  try {
    await pool.query<ResultSetHeader>('DELETE FROM carts WHERE user_id = ?', [req.user!.id]);
    res.success(null, '已清空');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('清空购物车失败: ' + msg);
    res.fail('清空购物车失败', 1, 500);
  }
});

export default router;
