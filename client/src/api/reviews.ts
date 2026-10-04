import request from '@/utils/request';

export interface Review {
  id: number;
  rating: number;
  content: string | null;
  images: string[];
  video_url: string | null;
  created_at: string;
  username: string;
  avatar: string | null;
  product_id: number;
}

export interface ProductReviewResult {
  list: Review[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
  avg_rating: string | null;
}

export interface CreateReviewParams {
  order_item_id: number;
  rating: number;
  content?: string;
  images?: string[];
  video_url?: string;
}

export const reviewApi = {
  create: (params: CreateReviewParams) => request.post('/reviews', params),

  my: () => request.get('/reviews/my').then((r) => r.data.data),

  byProduct: (productId: number, params?: { page?: number; size?: number }) =>
    request
      .get<{ data: ProductReviewResult }>(`/products/${productId}/reviews`, { params })
      .then((r) => r.data.data),
};
