export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  community_id: number;
  quantity: number;
  name: string;
  cover_url: string | null;
  unit: string;
  price: string;
  stock: number;
  community_name: string;
}

export interface CartGroup {
  community_id: number;
  community_name: string;
  items: CartItem[];
}

export interface CartResult {
  groups: CartGroup[];
  totalItems: number;
}
