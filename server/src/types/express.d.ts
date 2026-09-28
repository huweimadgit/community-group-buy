import 'express';

declare global {
  namespace Express {
    interface Response {
      success: (data?: unknown, message?: string) => void;
      fail: (message?: string, code?: number, httpStatus?: number) => void;
    }
  }
}

export {};
