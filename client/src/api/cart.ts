import request from '@/utils/request';
import type { CartResult } from '@/types/cart';

export interface AddCartParams {
  product_id: number;
  community_id: number;
  quantity: number;
}

export const cartApi = {
  list: () => request.get<{ data: CartResult }>('/cart').then((r) => r.data.data),

  add: (params: AddCartParams) => request.post('/cart', params),

  updateQuantity: (id: number, quantity: number) => request.put(`/cart/${id}`, { quantity }),

  remove: (id: number) => request.delete(`/cart/${id}`),

  clear: () => request.delete('/cart'),
};
