# API 文档（草案 v0.1）

> 统一返回：`{ code: 0, message: "ok", data: ... }`
> 鉴权：除标注「公开」外，都需要 `Authorization: Bearer <token>`

## 认证
| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| POST | /api/auth/register | 注册 | 公开 |
| POST | /api/auth/login | 登录，返回 token | 公开 |
| GET | /api/auth/me | 当前用户信息 | 登录 |

## 分类 / 商品
| 方法 | 路径 | 说明 | 权限 |
|---|---|---|---|
| GET | /api/categories | 分类树 | 公开 |
| GET | /api/products | 列表（category_id, keyword, page, size） | 公开 |
| GET | /api/products/:id | 详情 | 公开 |
| POST | /api/products | 新建 | leader/admin |
| PUT | /api/products/:id | 修改 | leader/admin |
| DELETE | /api/products/:id | 删除 | admin |

## 上传
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/upload/image | 图片上传（L1） |
| POST | /api/upload/video | 小视频直传（L1） |
| POST | /api/upload/video/init | L2 初始化分片 |
| POST | /api/upload/video/chunk | L2 传分片 |
| POST | /api/upload/video/complete | L2 合并 |
| GET | /api/upload/video/status | L2 查询已传分片 / 秒传 |

## 购物车
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/cart | 我的购物车 |
| POST | /api/cart | 加入 |
| PUT | /api/cart/:id | 改数量 |
| DELETE | /api/cart/:id | 删除 |

## 订单
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/orders | 下单（事务） |
| GET | /api/orders | 我的订单 |
| GET | /api/orders/:id | 详情 |
| POST | /api/orders/:id/pay | 支付 |
| POST | /api/orders/:id/cancel | 取消 |
| POST | /api/orders/:id/confirm | 确认收货 |
| POST | /api/orders/:id/ship | 发货（leader） |

## 团长
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/leader/products | 本团商品 |
| PUT | /api/leader/products/:id | 改本团库存/价 |
| GET | /api/leader/orders | 本团订单 |

## 评价
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/reviews | 写评价（含图片/视频） |
| GET | /api/products/:id/reviews | 商品评价列表 |

## 管理端
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/admin/stats/sales | 销售趋势 |
| GET | /api/admin/stats/top-products | 热销 Top10 |
| GET | /api/admin/users | 用户列表 |

## 健康检查
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/health | 部署后探活用，公开 |