# 社区团购平台

React + TypeScript + Node.js + MySQL 全栈项目。

## 在线访问

- 前端：https://community-group-buy-xxx.vercel.app
- 后端 API：https://community-group-buy-api.onrender.com

## 技术栈

- 前端：React 18 + TypeScript + Vite + React Router + Zustand + Ant Design + ECharts
- 后端：Node.js + TypeScript + Express + mysql2 + JWT + multer
- 数据库：MySQL（本地 Docker / 线上 TiDB Cloud）
- 文件存储：Cloudflare R2
- 部署：Vercel（前端）+ Render（后端）

## 核心功能

- 用户注册 / 登录（JWT）
- 商品浏览、搜索、分类筛选
- 购物车
- 下单（事务 + 悲观锁防超卖）
- 订单状态机（待支付/待发货/待自提/已完成）
- 评价（图片 + 视频）
- 视频分片上传（秒传 + 断点续传）
- 团长中心（本团商品库存/订单管理）
- 管理端（用户管理、数据看板）

## 本地开发

### 环境要求

- Node.js ≥ 18
- Docker Desktop

### 步骤

1. 启动 MySQL
   \`\`\`bash
   docker run -d --name cgb-mysql -p 3306:3306 \\
   -e MYSQL_ROOT_PASSWORD=root123456 \\
   -e MYSQL_DATABASE=community_group_buy \\
   -v cgb-mysql-data:/var/lib/mysql \\
   mysql:8.0
   \`\`\`

2. 后端
   \`\`\`bash
   cd server
   npm install
   cp .env.example .env # 填好配置
   npm run db:reset # 建表 + 种子数据
   npm run dev # http://localhost:3000
   \`\`\`

3. 前端
   \`\`\`bash
   cd client
   npm install
   npm run dev # http://localhost:5173
   \`\`\`

### 测试账号（密码都是 123456）

- 管理员：`admin`
- 团长：`leader1` / `leader2`
- 普通用户：`user1` / `user2`

## 目录结构

\`\`\`
community-group-buy/
├── docs/ # 需求、数据库、API 文档
├── server/ # 后端
└── client/ # 前端
\`\`\`

## 部署

- 前端：Vercel（自动构建）
- 后端：Render（自动部署）
- 数据库：TiDB Cloud
- 文件：Cloudflare R2

## 提交历史

（可选，附上 git log 的输出）

## 截图

（后续可以加）
