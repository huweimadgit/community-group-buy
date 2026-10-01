import { create } from 'zustand';
import { cartApi, type AddCartParams } from '@/api/cart';
import type { CartGroup } from '@/types/cart';
import { message } from 'antd';

interface CartState {
  groups: CartGroup[];
  totalItems: number;
  loading: boolean;

  fetchCart: () => Promise<void>;
  addToCart: (params: AddCartParams) => Promise<boolean>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clear: () => Promise<void>;
  reset: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  groups: [],
  totalItems: 0,
  loading: false,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const data = await cartApi.list();
      set({ groups: data.groups, totalItems: data.totalItems });
    } catch {
      set({ groups: [], totalItems: 0 });
    } finally {
      set({ loading: false });
    }
  },

  addToCart: async (params) => {
    try {
      await cartApi.add(params);
      message.success('已加入购物车');
      await get().fetchCart();
      return true;
    } catch {
      return false;
    }
  },

  updateQuantity: async (id, quantity) => {
    await cartApi.updateQuantity(id, quantity);
    await get().fetchCart();
  },

  removeItem: async (id) => {
    await cartApi.remove(id);
    message.success('已删除');
    await get().fetchCart();
  },

  clear: async () => {
    await cartApi.clear();
    set({ groups: [], totalItems: 0 });
  },

  reset: () => set({ groups: [], totalItems: 0 }),
}));
