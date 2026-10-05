# 社区团购平台

React + TypeScript + Node.js + MySQL 全栈项目。用户下单购买生鲜日用品到自提点取货，团长管理本团商品与订单，管理员管理全平台。

## 🌐 在线访问

- **前端**：https://community-group-buy.huweimad.workers.dev
- **后端 API**：https://community-group-buy.onrender.com
- **健康检查**：https://community-group-buy.onrender.com/api/health

> 后端部署在 Render 免费版，15 分钟无请求会休眠，首次访问需等 30-60 秒冷启动。

## 🔑 测试账号（密码都是 123456）

| 角色     | 用户名                |
| -------- | --------------------- |
| 管理员   | `admin`               |
| 团长     | `leader1` / `leader2` |
| 普通用户 | `user1` / `user2`     |

## ✨ 核心功能

- **用户端**：注册登录、商品浏览/搜索/筛选、购物车、下单支付、订单状态机、评价（图片 + 视频）
- **团长端**：本团数据统计、订单发货、商品库存/价格管理
- **管理端**：用户管理、全局订单、ECharts 数据看板

## 🛠 技术栈

- **前端**：React 18 + TypeScript + Vite + React Router + Zustand + Ant Design + ECharts
- **后端**：Node.js + TypeScript + Express + mysql2 + JWT + multer
- **数据库**：MySQL（本地 Docker / 线上 TiDB Cloud Serverless）
- **文件存储**：Cloudflare R2
- **部署**：Cloudflare Pages（前端）+ Render（后端）

## 🎯 技术亮点

- **事务 + 悲观锁**：下单扣库存 + 建订单 + 建订单项，三步原子操作，防止并发超卖
- **订单状态机**：每次状态流转都校验合法性
- **数据级权限**：团长只能操作本团数据
- **视频分片上传**：切片 + 秒传 + 断点续传 + 进度条
- **对象存储**：Cloudflare R2 托管所有图片和视频

## 🚀 本地开发

### 前置要求

- Node.js ≥ 18
- Docker Desktop

### 1. 启动 MySQL

```
docker run -d --name cgb-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root123456 -e MYSQL_DATABASE=community_group_buy -v cgb-mysql-data:/var/lib/mysql mysql:8.0
```

### 2. 后端

```
cd server
npm install
cp .env.example .env
npm run db:reset
npm run dev
```

### 3. 前端

```
cd client
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`，用测试账号登录。

## 📄 License

MIT
