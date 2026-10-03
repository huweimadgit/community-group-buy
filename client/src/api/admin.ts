import request from '@/utils/request';

export const adminApi = {
  users: (params?: { role?: string; page?: number; size?: number }) =>
    request.get('/admin/users', { params }).then((r) => r.data.data),

  updateUserStatus: (id: number, status: 'active' | 'banned') =>
    request.put(`/admin/users/${id}/status`, { status }),

  orders: (params?: { status?: string; page?: number; size?: number }) =>
    request.get('/admin/orders', { params }).then((r) => r.data.data),

  overview: () => request.get('/admin/stats/overview').then((r) => r.data.data),

  salesTrend: (days = 7) =>
    request.get('/admin/stats/sales-trend', { params: { days } }).then((r) => r.data.data),

  topProducts: (limit = 10) =>
    request.get('/admin/stats/top-products', { params: { limit } }).then((r) => r.data.data),

  orderStatus: () => request.get('/admin/stats/order-status').then((r) => r.data.data),
};
