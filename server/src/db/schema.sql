-- ============================================
-- 社区团购平台 - 数据库表结构
-- 字符集: utf8mb4  引擎: InnoDB（支持事务和外键）
-- ============================================

SET NAMES utf8mb4;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  username      VARCHAR(50)  NOT NULL                COMMENT '用户名',
  password_hash VARCHAR(100) NOT NULL                COMMENT '密码哈希(bcrypt)',
  phone         VARCHAR(20)  DEFAULT NULL            COMMENT '手机号',
  avatar        VARCHAR(255) DEFAULT NULL            COMMENT '头像URL',
  role          ENUM('user','leader','admin') NOT NULL DEFAULT 'user'   COMMENT '角色',
  status        ENUM('active','banned')       NOT NULL DEFAULT 'active' COMMENT '状态',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_username (username),
  KEY idx_role (role),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 2. 社区自提点表
CREATE TABLE IF NOT EXISTS communities (
  id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  name       VARCHAR(100) NOT NULL                COMMENT '社区名称',
  address    VARCHAR(255) NOT NULL                COMMENT '详细地址',
  leader_id  BIGINT       DEFAULT NULL            COMMENT '团长用户ID',
  status     ENUM('active','closed') NOT NULL DEFAULT 'active' COMMENT '状态',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_leader (leader_id),
  KEY idx_status (status),
  CONSTRAINT fk_community_leader FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='社区自提点';

-- 3. 商品分类表（支持二级）
CREATE TABLE IF NOT EXISTS categories (
  id         BIGINT      NOT NULL AUTO_INCREMENT,
  name       VARCHAR(50) NOT NULL                COMMENT '分类名',
  parent_id  BIGINT      DEFAULT NULL            COMMENT '父分类ID，NULL=一级',
  sort       INT         NOT NULL DEFAULT 0      COMMENT '排序值',
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_parent (parent_id),
  KEY idx_sort (sort)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品分类';

-- 4. 商品表（平台级）
CREATE TABLE IF NOT EXISTS products (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  category_id  BIGINT       NOT NULL             COMMENT '分类ID',
  name         VARCHAR(100) NOT NULL             COMMENT '商品名',
  description  TEXT                              COMMENT '描述',
  cover_url    VARCHAR(255) DEFAULT NULL         COMMENT '封面图',
  video_url    VARCHAR(255) DEFAULT NULL         COMMENT '主图视频',
  price        DECIMAL(10,2) NOT NULL            COMMENT '平台基准价',
  unit         VARCHAR(20)  NOT NULL DEFAULT '份' COMMENT '单位',
  status       ENUM('on','off') NOT NULL DEFAULT 'on' COMMENT '上下架',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_category_status (category_id, status),
  KEY idx_status (status),
  CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品';

-- 5. 社区商品表（同一商品在不同社区的库存和价格）
CREATE TABLE IF NOT EXISTS community_products (
  id           BIGINT        NOT NULL AUTO_INCREMENT,
  community_id BIGINT        NOT NULL,
  product_id   BIGINT        NOT NULL,
  stock        INT           NOT NULL DEFAULT 0  COMMENT '本团库存',
  price        DECIMAL(10,2) NOT NULL            COMMENT '本团价格',
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_community_product (community_id, product_id),
  KEY idx_product (product_id),
  CONSTRAINT fk_cp_community FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_product   FOREIGN KEY (product_id)   REFERENCES products(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='社区商品';

-- 6. 购物车
CREATE TABLE IF NOT EXISTS carts (
  id           BIGINT   NOT NULL AUTO_INCREMENT,
  user_id      BIGINT   NOT NULL,
  product_id   BIGINT   NOT NULL,
  community_id BIGINT   NOT NULL,
  quantity     INT      NOT NULL DEFAULT 1,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_product_community (user_id, product_id, community_id),
  KEY idx_user (user_id),
  CONSTRAINT fk_cart_user      FOREIGN KEY (user_id)      REFERENCES users(id)       ON DELETE CASCADE,
  CONSTRAINT fk_cart_product   FOREIGN KEY (product_id)   REFERENCES products(id)    ON DELETE CASCADE,
  CONSTRAINT fk_cart_community FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车';

-- 7. 订单
CREATE TABLE IF NOT EXISTS orders (
  id           BIGINT        NOT NULL AUTO_INCREMENT,
  order_no     VARCHAR(32)   NOT NULL             COMMENT '订单号',
  user_id      BIGINT        NOT NULL,
  community_id BIGINT        NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL             COMMENT '订单总额',
  status       ENUM('pending','paid','shipped','completed','canceled','refunding','refunded')
               NOT NULL DEFAULT 'pending'         COMMENT '订单状态',
  remark       VARCHAR(255)  DEFAULT NULL         COMMENT '备注',
  paid_at      DATETIME      DEFAULT NULL         COMMENT '支付时间',
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_order_no (order_no),
  KEY idx_user_created (user_id, created_at),
  KEY idx_community_status (community_id, status),
  KEY idx_status (status),
  CONSTRAINT fk_order_user      FOREIGN KEY (user_id)      REFERENCES users(id),
  CONSTRAINT fk_order_community FOREIGN KEY (community_id) REFERENCES communities(id)    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单';

-- 8. 订单项（下单时的商品快照）
CREATE TABLE IF NOT EXISTS order_items (
  id            BIGINT        NOT NULL AUTO_INCREMENT,
  order_id      BIGINT        NOT NULL,
  product_id    BIGINT        NOT NULL,
  product_name  VARCHAR(100)  NOT NULL            COMMENT '商品名快照',
  product_price DECIMAL(10,2) NOT NULL            COMMENT '单价快照',
  quantity      INT           NOT NULL,
  subtotal      DECIMAL(10,2) NOT NULL            COMMENT '小计',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order (order_id),
  KEY idx_product (product_id),
  CONSTRAINT fk_item_order   FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单项';

-- 9. 支付记录
CREATE TABLE IF NOT EXISTS payments (
  id         BIGINT        NOT NULL AUTO_INCREMENT,
  order_id   BIGINT        NOT NULL,
  amount     DECIMAL(10,2) NOT NULL,
  method     ENUM('mock')  NOT NULL DEFAULT 'mock' COMMENT '支付方式',
  status     ENUM('pending','success','failed') NOT NULL DEFAULT 'pending',
  paid_at    DATETIME      DEFAULT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order (order_id),
  CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录';

-- 10. 评价
CREATE TABLE IF NOT EXISTS reviews (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  user_id       BIGINT       NOT NULL,
  order_item_id BIGINT       NOT NULL,
  rating        TINYINT      NOT NULL            COMMENT '1-5 星',
  content       TEXT                             COMMENT '评价内容',
  images        JSON                             COMMENT '图片URL数组',
  video_url     VARCHAR(255) DEFAULT NULL        COMMENT '评价视频URL',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_order_item (order_item_id),
  KEY idx_user (user_id),
  CONSTRAINT fk_review_user       FOREIGN KEY (user_id)       REFERENCES users(id),
  CONSTRAINT fk_review_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评价';

-- 11. 媒体文件（统一管理商品/评价的图片视频）
CREATE TABLE IF NOT EXISTS media (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  owner_type ENUM('product','review') NOT NULL   COMMENT '归属类型',
  owner_id   BIGINT       DEFAULT NULL           COMMENT '归属ID（上传时可能还没确定）',
  type       ENUM('image','video')    NOT NULL,
  url        VARCHAR(255) NOT NULL,
  file_hash  VARCHAR(64)  DEFAULT NULL           COMMENT '文件hash（用于秒传）'
  cover_url  VARCHAR(255) DEFAULT NULL           COMMENT '视频封面',
  size       BIGINT       NOT NULL DEFAULT 0     COMMENT '字节数',
  duration   INT          DEFAULT NULL           COMMENT '视频时长(秒)',
  status     ENUM('uploading','done') NOT NULL DEFAULT 'done',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY un_file_hash (file_hash),
  KEY idx_owner (owner_type, owner_id),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='媒体文件';

-- 12. 分片上传记录（L2 分片上传用）
CREATE TABLE IF NOT EXISTS upload_chunks (
  id           BIGINT      NOT NULL AUTO_INCREMENT,
  file_hash    VARCHAR(64) NOT NULL             COMMENT '文件hash',
  chunk_index  INT         NOT NULL             COMMENT '分片序号(从0开始)',
  total_chunks INT         NOT NULL             COMMENT '分片总数',
  chunk_path   VARCHAR(255) NOT NULL            COMMENT '分片临时路径',
  media_id     BIGINT      DEFAULT NULL         COMMENT '关联media',
  created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_hash_index (file_hash, chunk_index),
  KEY idx_media (media_id),
  KEY idx_hash (file_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分片上传记录';