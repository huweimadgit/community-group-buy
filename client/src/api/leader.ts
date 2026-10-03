import request from '@/utils/request';

export const leaderApi = {
  community: () =>
    request
      .get<{ data: { id: number; name: string } }>('/leader/community')
      .then((r) => r.data.data),

  orders: (params?: { status?: string; page?: number; size?: number }) =>
    request.get('/leader/orders', { params }).then((r) => r.data.data),

  products: () => request.get('/leader/products').then((r) => r.data.data),

  updateProduct: (cpId: number, params: { stock?: number; price?: number }) =>
    request.put(`/leader/products/${cpId}`, params),

  stats: () => request.get('/leader/stats').then((r) => r.data.data),
};
