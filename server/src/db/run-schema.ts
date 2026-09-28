import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
  const sqlPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  logger.info('开始执行建表脚本...');
  await conn.query(sql);
  logger.info('建表完成 ✅');

  const [rows] = await conn.query('SHOW TABLES');
  const tables = rows as Record<string, string>[];
  logger.info(`当前数据库共有 ${tables.length} 张表：`);
  tables.forEach((r) => logger.info('  - ' + Object.values(r)[0]));

  await conn.end();
};

run().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error('建表失败: ' + message);
  process.exit(1);
});
