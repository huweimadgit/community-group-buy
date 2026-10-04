import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import crypto from 'node:crypto';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { uploadImage, uploadVideo, uploadChunk, UPLOAD_DIR_PATH } from '../middlewares/upload.js';
import { requireAuth } from '../middlewares/auth.js';
import { pool } from '../config/db.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// 分片临时目录：server/tmp/chunks/{file_hash}/
const CHUNK_BASE = path.resolve(process.cwd(), 'tmp', 'chunks');
if (!fs.existsSync(CHUNK_BASE)) {
  fs.mkdirSync(CHUNK_BASE, { recursive: true });
}

// ============================================================
// POST /api/upload/image — L1:图片直传（leader/admin 用于商品；所有登录用户用于评价）
// ============================================================
router.post(
  '/image',
  requireAuth,
  (req, res, next) => {
    uploadImage.single('file')(req, res, (err) => {
      if (err) {
        logger.error('图片上传失败: ' + err.message);
        return res.fail(err.message || '上传失败', 400, 400);
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.fail('未接收到文件，字段名应为 file', 400, 400);
    }
    const url = `/uploads/${req.file.filename}`;
    res.success({
      url,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  },
);

// ============================================================
// POST /api/upload/video — L1:视频直传（登录用户即可，用于评价；管理端也能用）（≤50MB，小视频够用）
// ============================================================
router.post(
  '/video',
  requireAuth,
  (req, res, next) => {
    uploadVideo.single('file')(req, res, (err) => {
      if (err) {
        logger.error('视频上传失败: ' + err.message);
        return res.fail(err.message || '上传失败', 400, 400);
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) return res.fail('未接收到文件，字段名应为 file', 400, 400);
    res.success({
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  },
);

// ============================================================
// L2：分片上传 —— 初始化
// POST /api/upload/video/init
// body: { file_hash, file_name, file_size, total_chunks }
// ============================================================
router.post('/video/init', requireAuth, async (req, res) => {
  const { file_hash, file_size, total_chunks } = req.body as {
    file_hash?: unknown;
    file_size?: unknown;
    total_chunks?: unknown;
  };

  if (typeof file_hash !== 'string' || file_hash.length === 0 || file_hash.length > 64) {
    return res.fail('file_hash 无效', 400, 400);
  }
  const size = Number(file_size);
  const total = Number(total_chunks);
  if (!Number.isInteger(size) || size <= 0) return res.fail('file_size 无效', 400, 400);
  if (!Number.isInteger(total) || total <= 0) return res.fail('total_chunks 无效', 400, 400);

  try {
    // 1. 秒传：媒体表里已有相同 hash
    const [exist] = await pool.query<RowDataPacket[]>(
      `SELECT id, url FROM media WHERE file_hash = ? LIMIT 1`,
      [file_hash],
    );
    if (exist.length > 0) {
      return res.success({
        uploaded: true,
        url: exist[0].url,
        uploaded_chunks: [],
        total_chunks: total,
      });
    }

    // 2. 断点续传：查已上传的分片
    const [chunks] = await pool.query<RowDataPacket[]>(
      `SELECT chunk_index FROM upload_chunks WHERE file_hash = ? ORDER BY chunk_index`,
      [file_hash],
    );
    const uploadedChunks = chunks.map((c) => c.chunk_index as number);

    res.success({
      uploaded: false,
      uploaded_chunks: uploadedChunks,
      total_chunks: total,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('分片初始化失败: ' + msg);
    res.fail('分片初始化失败', 1, 500);
  }
});

// ============================================================
// L2：分片上传 —— 接收单个分片
// POST /api/upload/video/chunk
// multipart/form-data: file + file_hash + chunk_index + total_chunks
// ============================================================
router.post(
  '/video/chunk',
  requireAuth,
  (req, res, next) => {
    uploadChunk.single('file')(req, res, (err) => {
      if (err) {
        logger.error('分片接收失败: ' + err.message);
        return res.fail(err.message || '分片接收失败', 400, 400);
      }
      next();
    });
  },
  async (req, res) => {
    const { file_hash, chunk_index, total_chunks } = req.body as {
      file_hash?: unknown;
      chunk_index?: unknown;
      total_chunks?: unknown;
    };

    if (typeof file_hash !== 'string' || !file_hash) {
      return res.fail('file_hash 无效', 400, 400);
    }
    const idx = Number(chunk_index);
    const total = Number(total_chunks);
    if (!Number.isInteger(idx) || idx < 0) return res.fail('chunk_index 无效', 400, 400);
    if (!Number.isInteger(total) || total <= 0) return res.fail('total_chunk 无效', 400, 400);
    if (!req.file) return res.fail('未接收到分片文件', 400, 400);

    try {
      // 分片存到 tmp/chunks/{hash}/{index}
      const chunkDir = path.join(CHUNK_BASE, file_hash);
      await fsp.mkdir(chunkDir, { recursive: true });
      const chunkPath = path.join(chunkDir, String(idx));
      await fsp.writeFile(chunkPath, req.file.buffer);

      // 写 upload_chunks 表（唯一索引冲突就忽略）
      await pool.query(
        `INSERT INTO upload_chunks (file_hash, chunk_index, total_chunks, chunk_path)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE chunk_path = VALUES(chunk_path)`,
        [file_hash, idx, total, chunkPath],
      );

      res.success({ chunk_index: idx });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('保存分片失败: ' + msg);
      res.fail('保存分片失败', 1, 500);
    }
  },
);

// ============================================================
// L2：分片上传 —— 合并
// POST /api/upload/video/complete
// body: { file_hash, file_name, file_size, total_chunks }
// ============================================================
router.post('/video/complete', requireAuth, async (req, res) => {
  const { file_hash, file_name, file_size, total_chunks } = req.body as {
    file_hash?: unknown;
    file_name?: unknown;
    file_size?: unknown;
    total_chunks?: unknown;
  };

  if (typeof file_hash !== 'string' || !file_hash) return res.fail('file_hash 无效', 400, 400);
  if (typeof file_name !== 'string' || !file_name) return res.fail('file_name 无效', 400, 400);
  const size = Number(file_size);
  const total = Number(total_chunks);
  if (!Number.isInteger(size) || size <= 0) return res.fail('file_size 无效', 400, 400);
  if (!Number.isInteger(total) || total <= 0) return res.fail('total_chunks 无效', 400, 400);

  try {
    // 1. 取所有分片（按 index 排序）
    const [chunks] = await pool.query<RowDataPacket[]>(
      `SELECT chunk_index, chunk_path FROM upload_chunks
       WHERE file_hash = ? ORDER BY chunk_index ASC`,
      [file_hash],
    );

    if (chunks.length != total) {
      return res.fail(`分片不完整（${chunks.length}/${total}）`, 400, 400);
    }
    for (let i = 0; i < total; i++) {
      if ((chunks[i].chunk_index as number) !== i) {
        return res.fail(`分片确实或乱序（缺 index=${i}）`, 400, 400);
      }
    }

    // 2. 用 CHUNK_BASE + file_hash + index 拼实际路径（不依赖数据库存的路径）
    const chunkDir = path.join(CHUNK_BASE, file_hash);
    const chunkPaths: string[] = [];
    for (let i = 0; i < total; i++) {
      const p = path.join(chunkDir, String(i));
      if (!fs.existsSync(p)) {
        return res.fail(`分片文件不存在：index=${i}`, 400, 400);
      }
      chunkPaths.push(p);
    }
    // 5. 生成本次最终文件名
    const ext = path.extname(file_name).toLowerCase() || '.mp4';
    const finalName = `${Date.now()}=${crypto.randomBytes(8).toString('hex')}${ext}`;
    const finalPath = path.join(UPLOAD_DIR_PATH, finalName);

    // 4. 流式合并
    await new Promise<void>((resolve, reject) => {
      const ws = fs.createWriteStream(finalPath);
      ws.on('error', reject);
      ws.on('finish', resolve);

      const appendNext = (i: number) => {
        if (i >= chunkPaths.length) {
          ws.end();
          return;
        }
        const rs = fs.createReadStream(chunkPaths[i]);
        rs.on('error', reject);
        rs.on('end', () => appendNext(i + 1));
        rs.pipe(ws, { end: false });
      };
      appendNext(0);
    });

    // 5. 清理分片
    await fsp.rm(chunkDir, { recursive: true, force: true });
    await pool.query(`DELETE FROM upload_chunks WHERE file_hash = ?`, [file_hash]);

    // 6. 写 media 表（用于秒传）
    const url = `/uploads/${finalName}`;
    await pool.query<ResultSetHeader>(
      `INSERT INTO media (owner_type, owner_id, type, url, file_hash, size, status)
       VALUES ('review', null, 'video', ?, ?, ?, 'done')
       ON DUPLICATE KEY UPDATE url = VALUES(url), size = VALUES(size), status = 'done'`,
      [url, file_hash, size],
    );

    res.success({ url, filename: finalName, size });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('合并分片失败: ' + msg);
    res.fail('合并分片失败', 1, 500);
  }
});

export default router;
