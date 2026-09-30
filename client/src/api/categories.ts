import request from '@/utils/request';
import type { Category } from '@/types/category';

export const categoryApi = {
  tree: () => request.get<{ data: Category[] }>('/categories').then((r) => r.data.data),
};
