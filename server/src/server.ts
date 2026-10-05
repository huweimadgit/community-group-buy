import 'dotenv/config';
import app from './app.js';
import { logger } from './utils/logger.js';
import { pool } from './config/db.js';

const PORT = Number(process.env.PORT) || 3000;

const start = async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    logger.info('MySQL 连接成功');

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`服务已启动，监听 0.0.0.0:${PORT}`);
      logger.info(`健康检查: /api/health`);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('启动失败: ' + message);
    process.exit(1);
  }
};

start();
