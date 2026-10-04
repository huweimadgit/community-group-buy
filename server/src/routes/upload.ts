import express from 'express';
import { uploadImage, uploadVideo } from '../middlewares/upload.js';
import { requireAuth } from '../middlewares/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// ============================================================
// POST /api/upload/image — 图片上传（leader/admin 用于商品；所有登录用户用于评价）
// ============================================================
router.post(
  '/image',
  requireAuth,
  (req, res, next) => {
    uploadImage.single('file')(req, res, (err) => {
      if (err) {
        logger.error('上传失败: ' + err.message);
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
// POST /api/upload/video — 视频上传（登录用户即可，用于评价；管理端也能用）
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

export default router;
