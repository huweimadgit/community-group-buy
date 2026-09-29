import express from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = express.Router();

interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  parent_id: number | null;
  sort: number;
}

interface CategoryNode extends CategoryRow {
  children: CategoryNode[];
}

function buildTree(list: CategoryRow[]): CategoryNode[] {
  const map = new Map<number, CategoryNode>();
  list.forEach((c) => map.set(c.id, { ...c, children: [] }));

  const roots: CategoryNode[] = [];
  list.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent_id === null) {
      roots.push(node);
    } else {
      const parent = map.get(c.parent_id);
      if (parent) parent.children.push(node);
      else roots.push(node); // 父分类不存在就当一级
    }
  });
  return roots;
}

// GET /api/categories — 公开，返回树形结构
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query<CategoryRow[]>(
      'SELECT id, name, parent_id, sort FROM categories ORDER BY sort ASC, id ASC',
    );
    res.success(buildTree(rows));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('查询分类失败: ' + msg);
    res.fail('查询分类失败', 1, 500);
  }
});

// POST /api/categories — 仅 admin
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, parent_id, sort } = req.body as {
    name?: unknown;
    parent_id?: unknown;
    sort?: unknown;
  };

  if (typeof name !== 'string' || name.length === 0 || name.length > 50) {
    return res.fail('分类名长度需在 1-50 字符之间', 400, 400);
  }
  const parentId = parent_id === undefined || parent_id === null ? null : Number(parent_id);
  const sortVal = typeof sort === 'number' ? sort : 0;

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO categories (name, parent_id, sort) VALUES (?, ?, ?)',
      [name, parentId, sortVal],
    );
    res.success({ id: result.insertId }, '创建成功');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('创建分类失败: ' + msg);
    res.fail('创建分类失败', 1, 500);
  }
});

// PUT /api/categories/:id — 仅 admin
router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.fail('分类 ID 无效', 400, 400);
  }
  const { name, parent_id, sort } = req.body as {
    name?: unknown;
    parent_id?: unknown;
    sort?: unknown;
  };

  const fields: string[] = [];
  const params: unknown[] = [];
  if (typeof name === 'string' && name.length > 0) {
    fields.push('name = ?');
    params.push(name);
  }
  if (parent_id !== undefined) {
    fields.push('parent_id = ?');
    params.push(parent_id === null ? null : Number(parent_id));
  }
  if (typeof sort === 'number') {
    fields.push('sort = ?');
    params.push(sort);
  }
  if (fields.length === 0) {
    return res.fail('没有需要更新的字段', 400, 400);
  }

  params.push(id);
  try {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
      params,
    );
    if (result.affectedRows === 0) {
      return res.fail('分类不存在', 404, 404);
    }
    res.success(null, '更新成功');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('更新分类失败: ' + msg);
    res.fail('更新分类失败', 1, 500);
  }
});

// DELETE /api/categories/:id — 仅 admin
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.fail('分类 ID 无效', 400, 400);
  }
  try {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.fail('分类不存在', 404, 404);
    }
    res.success(null, '删除成功');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('删除分类失败: ' + msg);
    res.fail('删除失败：该分类下可能还有商品', 1, 500);
  }
});

export default router;
