import { create } from 'zustand';
import type { User } from '@/types/user';
import { authApi, type LoginParams } from '@/api/auth';
import { useCartStore } from './cart';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (params: LoginParams) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,

  login: async (params) => {
    set({ loading: true });
    try {
      const { token, user } = await authApi.login(params);
      localStorage.setItem('token', token);
      set({ token, user });
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
    useCartStore.getState().reset();
  },

  fetchMe: async () => {
    try {
      const user = await authApi.me();
      set({ user });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },
}));
