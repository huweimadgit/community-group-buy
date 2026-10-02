export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_price: string;
  quantity: number;
  subtotal: string;
}

export type OrderStatus =
  'pending' | 'paid' | 'shipped' | 'completed' | 'canceled' | 'refunding' | 'refunded';

export interface Order {
  id: number;
  order_no: string;
  user_id: number;
  community_id: number;
  total_amount: string;
  status: OrderStatus;
  remark: string | null;
  paid_at: string | null;
  created_at: string;
  community_name: string;
  username?: string;
  items: OrderItem[];
}

export interface OrderListResult {
  list: Order[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

export const ORDER_STATUS_TEXT: Record<OrderStatus, string> = {
  pending: '待支付',
  paid: '待发货',
  shipped: '待自提',
  completed: '已完成',
  canceled: '已取消',
  refunding: '退款中',
  refunded: '已退款',
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'orange',
  paid: 'blue',
  shipped: 'cyan',
  completed: 'green',
  canceled: 'default',
  refunding: 'purple',
  refunded: 'default',
};
