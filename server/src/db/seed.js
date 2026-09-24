import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { logger } from '../utils/logger.js';

const run = async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
  });

  logger.info('开始插入种子数据...');

  // 所有测试账号密码都是 123456
  const passwordHash = bcrypt.hashSync('123456', 10);

  // 1. 用户
  await conn.query(
    `INSERT INTO users (username, password_hash, phone, role) VALUES
      ('admin',  ?, '13800000001', 'admin'),
      ('leader1',?, '13800000002', 'leader'),
      ('leader2',?, '13800000003', 'leader'),
      ('user1',  ?, '13800000004', 'user'),
      ('user2',  ?, '13800000005', 'user')
     ON DUPLICATE KEY UPDATE phone = VALUES(phone)`,
    [passwordHash, passwordHash, passwordHash, passwordHash, passwordHash],
  );
  logger.info('用户插入完成');

  const [userRows] = await conn.query(`SELECT id, username FROM users`);
  const userMap = Object.fromEntries(userRows.map((u) => [u.username, u.id]));

  // 2. 社区
  await conn.query(
    `INSERT INTO communities (id, name, address, leader_id) VALUES
      (1, '阳光花园自提点', '阳光花园东门 1 号商铺', ?),
      (2, '翠湖苑自提点',   '翠湖苑北门快递驿站',   ?)
     ON DUPLICATE KEY UPDATE address = VALUES(address)`,
    [userMap['leader1'], userMap['leader2']],
  );
  logger.info('社区插入完成');

  // 3. 分类
  await conn.query(
    `INSERT INTO categories (id, name, parent_id, sort) VALUES
      (1, '新鲜果蔬', NULL, 1),
      (2, '肉禽蛋品', NULL, 2),
      (3, '海鲜水产', NULL, 3),
      (4, '粮油调味', NULL, 4),
      (5, '日用百货', NULL, 5)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
  );
  logger.info('分类插入完成');

  // 4. 商品
  await conn.query(
    `INSERT INTO products (id, category_id, name, description, price, unit) VALUES
      (1, 1, '红富士苹果',     '山东烟台产地直发，脆甜多汁', 12.80, '斤'),
      (2, 1, '海南香蕉',       '自然熟，无催熟剂',           6.50,  '斤'),
      (3, 2, '土鸡蛋',         '散养土鸡蛋，30枚装',         29.90, '盒'),
      (4, 2, '黑猪五花肉',     '当日现杀，冷链配送',         45.00, '斤'),
      (5, 3, '大闸蟹',         '阳澄湖大闸蟹，公母各半',     88.00, '只'),
      (6, 4, '五常大米',       '东北五常稻花香，10斤装',     59.90, '袋')
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
  );
  logger.info('商品插入完成');

  // 5. 社区商品（库存与价格）
  await conn.query(
    `INSERT INTO community_products (community_id, product_id, stock, price) VALUES
      (1, 1, 100, 12.80), (1, 2, 100, 6.50), (1, 3, 50, 29.90), (1, 4, 30, 45.00),
      (2, 1, 80,  13.00), (2, 2, 80,  6.80), (2, 5, 20, 88.00), (2, 6, 40, 59.90)
     ON DUPLICATE KEY UPDATE stock = VALUES(stock), price = VALUES(price)`,
  );
  logger.info('社区商品插入完成');

  logger.info('种子数据全部完成 ✅');
  logger.info('测试账号（密码统一 123456）：');
  logger.info('  admin / leader1 / leader2 / user1 / user2');

  await conn.end();
};

run().catch((err) => {
  logger.error('种子数据失败: ' + err.message);
  process.exit(1);
});
