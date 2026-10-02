import request from '@/utils/request';
import type { Order, OrderListResult } from '@/types/order';

export interface CreateOrderParams {
  community_id: number;
  remark?: string;
}

export const orderApi = {
  create: (params: CreateOrderParams) =>
    request
      .post<{ data: { order_id: number; order_no: string; total_amount: string } }>(
        '/orders',
        params,
      )
      .then((r) => r.data.data),

  list: (params?: { status?: string; page?: number; size?: number }) =>
    request.get<{ data: OrderListResult }>('/orders', { params }).then((r) => r.data.data),

  detail: (id: number) => request.get<{ data: Order }>(`/orders/${id}`).then((r) => r.data.data),

  pay: (id: number) => request.post(`/orders/${id}/pay`),
  cancel: (id: number) => request.post(`/orders/${id}/cancel`),
  confirm: (id: number) => request.post(`/orders/${id}/confirm`),
  ship: (id: number) => request.post(`/orders/${id}/ship`),
};
