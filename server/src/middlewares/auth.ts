import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type UserRole } from '../utils/jwt.js';

/**
 * 认证中间件：校验 Authorization: Bearer <token>
 * 校验通过后把用户信息挂到 req.user
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.fail('未提供认证令牌', 401, 401);
  }

  const token = authHeader.slice(7); // 去掉 "Bearer "
  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.id,
      username: payload.username,
      role: payload.role,
    };
    next();
  } catch {
    res.fail('认证失败或令牌已过期', 401, 401);
  }
};

/**
 * 角色中间件：只允许指定角色通过
 * 用法：router.post('/', requireAuth, requireRole('admin'), handler)
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.fail('未登录', 401, 401);
    }
    if (!roles.includes(req.user.role)) {
      return res.fail('权限不足', 403, 403);
    }
    next();
  };
};
