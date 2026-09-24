import 'dotenv/config';
import app from './app.js';
import { logger } from './utils/logger.js';
import { pool } from './config/db.js';

const PORT = process.env.PORT || 3000;

const start = async () => {
    try {
        const conn = await pool.getConnection();
        await conn.ping();
        conn.release();
        logger.info('MySQL 连接成功');

        app.listen(PORT, () => {
            logger.info(`服务已启动: http://localhost:${PORT}`);
            logger.info(`健康检查: http://localhost:${PORT}/api/health`);
        })
    } catch (err) {
        logger.error('启动失败: ' + err.message);
        process.exit(1);
    }
};

start();