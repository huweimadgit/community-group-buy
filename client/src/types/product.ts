export interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  cover_url: string | null;
  video_url: string | null;
  price: string;
  unit: string;
  status: 'on' | 'off';
  created_at: string;
  category_name?: string;
  stock?: number | null;
  community_price?: string | null;
}

export interface ProductListParams {
  page?: number;
  size?: number;
  category_id?: number;
  community_id?: number;
  keyword?: string;
}

export interface Pagination {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface ProductListResult {
  list: Product[];
  pagination: Pagination;
}
