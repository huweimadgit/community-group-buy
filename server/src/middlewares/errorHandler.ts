import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

interface HttpError extends Error {
  status?: number;
}

export const notFound = (req: Request, res: Response, _next: NextFunction) => {
  res.fail(`接口不存在: ${req.method} ${req.originalUrl}`, 404, 404);
};

export const errorHandler = (err: HttpError, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}\n${err.stack}`);
  res.fail(err.message || '服务器内部错误', 1, err.status || 500);
};
