import 'express';
import type { UserRole } from '../utils/jwt.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: UserRole;
      };
    }
    interface Response {
      success: (data?: unknown, message?: string) => void;
      fail: (message?: string, code?: number, httpStatus?: number) => void;
    }
  }
}

export {};
