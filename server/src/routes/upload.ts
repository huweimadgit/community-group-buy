import express from 'express';
import { uploadImage } from '../middlewares/upload.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// POST /api/upload/image — leader/admin
router.post(
  '/image',
  requireAuth,
  requireRole('admin', 'leader'),
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

export default router;
