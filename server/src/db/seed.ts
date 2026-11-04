import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/db.js';
import { logger } from '../utils/logger.js';

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
}

const run = async () => {
  const conn = await pool.getConnection();
  try {
    logger.info('开始插入种子数据...');

    const passwordHash = bcrypt.hashSync('123456', 10);

    await conn.query(
      `INSERT INTO users (username, password_hash, phone, role) VALUES
        ('admin',   ?, '13800000001', 'admin'),
        ('leader1', ?, '13800000002', 'leader'),
        ('leader2', ?, '13800000003', 'leader'),
        ('user1',   ?, '13800000004', 'user'),
        ('user2',   ?, '13800000005', 'user')
       ON DUPLICATE KEY UPDATE phone = VALUES(phone)`,
      [passwordHash, passwordHash, passwordHash, passwordHash, passwordHash],
    );
    logger.info('用户插入完成');

    const [userRows] = await conn.query<UserRow[]>(`SELECT id, username FROM users`);
    const userMap: Record<string, number> = Object.fromEntries(
      userRows.map((u): [string, number] => [u.username, u.id]),
    );

    await conn.query(
      `INSERT INTO communities (id, name, address, leader_id) VALUES
        (1, '阳光花园自提点', '阳光花园东门 1 号商铺', ?),
        (2, '翠湖苑自提点',   '翠湖苑北门快递驿站',   ?)
       ON DUPLICATE KEY UPDATE address = VALUES(address)`,
      [userMap['leader1'], userMap['leader2']],
    );
    logger.info('社区插入完成');

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

    await conn.query(
      `INSERT INTO products (id, category_id, name, description, cover_url, price, unit) VALUES
        (1, 1, '烟台红富士苹果', '脆甜多汁，产地直发，坏果包赔', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&q=80', 12.80, '斤'),
        (2, 1, '海南特级香蕉', '自然熟，香甜软糯，无催熟剂', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&q=80', 6.50, '斤'),
        (3, 1, '阳光玫瑰青提', '清甜无籽，带有玫瑰香气，新鲜采摘', 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&q=80', 25.00, '斤'),
        (4, 2, '农家散养土鸡蛋', '吃虫子长大的鸡下的蛋，蛋黄饱满', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&q=80', 29.90, '盒'),
        (5, 2, '黑猪五花肉', '当日现杀，冷链配送，肥瘦相间', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&q=80', 45.00, '斤'),
        (6, 3, '鲜活大闸蟹', '阳澄湖大闸蟹，公母各半，蟹黄饱满', 'https://images.unsplash.com/photo-1550481890-22623c0b1a9b?w=500&q=80', 88.00, '只'),
        (7, 4, '东北五常大米', '稻花香2号，米粒饱满，软糯香甜', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80', 59.90, '袋'),
        (8, 5, '原木抽纸', '原生木浆，柔软亲肤，家庭装', 'https://images.unsplash.com/photo-1584820927498-cafe3c157921?w=500&q=80', 19.90, '提')
      ON DUPLICATE KEY UPDATE name = VALUES(name), cover_url = VALUES(cover_url)`,
    );

    logger.info('商品插入完成');

    await conn.query(
      `INSERT INTO community_products (community_id, product_id, stock, price) VALUES
        (1, 1, 100, 12.80), (1, 2, 100, 6.50), (1, 3, 50, 25.00), (1, 4, 50, 29.90),
        (1, 5, 30, 45.00), (1, 7, 40, 59.90), (1, 8, 100, 19.90),
        (2, 1, 80, 13.00), (2, 2, 80, 6.80), (2, 4, 40, 30.00), (2, 6, 20, 88.00)
      ON DUPLICATE KEY UPDATE stock = VALUES(stock), price = VALUES(price)`,
    );
    logger.info('社区商品插入完成');

    logger.info('种子数据全部完成 ✅');
    logger.info('测试账号（密码统一 123456）：');
    logger.info('  admin / leader1 / leader2 / user1 / user2');
  } finally {
    conn.release();
    await pool.end();
  }
};

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('种子数据失败: ' + message);
    process.exit(1);
  });
