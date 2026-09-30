import request from '@/utils/request';
import type { User } from '@/types/user';

export interface LoginParams {
  username: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

export const authApi = {
  login: (params: LoginParams) =>
    request.post<{ data: AuthResult }>('/auth/login', params).then((r) => r.data.data),

  register: (params: LoginParams & { phone?: string }) =>
    request.post<{ data: AuthResult }>('/auth/register', params).then((r) => r.data.data),

  me: () => request.get<{ data: User }>('/auth/me').then((r) => r.data.data),
};
