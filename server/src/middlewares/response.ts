import type { Request, Response, NextFunction } from 'express';

export const responseHandler = (_req: Request, res: Response, next: NextFunction) => {
  res.success = (data: unknown = null, message = 'ok') => {
    res.json({ code: 0, message, data });
  };
  res.fail = (message = 'error', code = 1, httpStatus = 200) => {
    res.status(httpStatus).json({ code, message, data: null });
  };
  next();
};
