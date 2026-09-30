import request from '@/utils/request';
import type { Product, ProductListParams, ProductListResult } from '@/types/product';

export const productApi = {
  list: (params: ProductListParams) =>
    request.get<{ data: ProductListResult }>('/products', { params }).then((r) => r.data.data),

  detail: (id: number) =>
    request.get<{ data: Product }>(`/products/${id}`).then((r) => r.data.data),
};
