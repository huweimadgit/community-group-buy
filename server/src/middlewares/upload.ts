import multer from 'multer';

const storage = multer.memoryStorage();

// 图片上传：≤5MB
export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error('只允许上传 jpg / png / webp / gif 图片'));
      return;
    }
    cb(null, true);
  },
});

// 视频上传：≤50MB
export const uploadVideo = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error('只允许上传 mp4 / webm/ mov 视频'));
      return;
    }
    cb(null, true);
  },
});

// 分片上传： 把分片放内存，因为 handler 要按 hash 分目录存
export const uploadChunk = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 单分片 ≤10MB
});
