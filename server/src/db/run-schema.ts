import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
  const sqlPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const conn = await pool.getConnection();
  try {
    logger.info('开始执行建表脚本...');
    await conn.query(sql);
    logger.info('建表完成 ✅');

    const [rows] = await conn.query('SHOW TABLES');
    const tables = rows as Record<string, string>[];
    logger.info(`当前数据库共有 ${tables.length} 张表：`);
    tables.forEach((r) => logger.info('  - ' + Object.values(r)[0]));
  } finally {
    conn.release();
    await pool.end();
  }
};

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('建表失败: ' + message);
    process.exit(1);
  });
