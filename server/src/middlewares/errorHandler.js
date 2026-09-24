import { logger } from '../utils/logger.js';

export const notFound = (req, res, next) => {
    res.fail(`接口不存在：${req.method} ${req.originalUrl}`, 404, 404);
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
    logger.error(`${req.method} ${req.originalUrl} - ${err.message}\n${err.stack}`);
    res.fail(err.message || '服务器内部错误', 1, err.status || 500);
};