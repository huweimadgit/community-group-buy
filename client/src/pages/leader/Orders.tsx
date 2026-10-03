import { useEffect, useState } from 'react';
import { Card, Tag, Button, Empty, Spin, Space, Pagination, message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { leaderApi } from '@/api/leader';
import { orderApi } from '@/api/orders';
import { type OrderStatus, ORDER_STATUS_TEXT, ORDER_STATUS_COLOR } from '@/types/order';

const STATUS_TABS = [
  { value: '', label: '全部' },
  { value: 'paid', label: '待发货' },
  { value: 'shipped', label: '待自提' },
  { value: 'completed', label: '已完成' },
];

interface LeaderOrder {
  id: number;
  order_no: string;
  username: string;
  total_amount: string;
  status: OrderStatus;
  created_at: string;
  items: { id: number; product_name: string; quantity: number }[];
}

export default function LeaderOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<LeaderOrder[]>([]);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0, totalPages: 0 });

  const load = () => {
    setLoading(true);
    leaderApi
      .orders({ status: status || undefined, page, size: 10 })
      .then((data: { list: LeaderOrder[]; pagination: typeof pagination }) => {
        setOrders(data.list);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // elint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  const updateParams = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === '') params.delete(k);
      else params.set(k, String(v));
    });
    setSearchParams(params);
  };

  const handleShip = async (id: number) => {
    try {
      await orderApi.ship(id);
      message.success('已发货');
      load();
    } catch {
      // 已统一提示
    }
  };

  return (
    <div>
      <h2>本团订单</h2>

      <Space style={{ marginBottom: 16 }}>
        {STATUS_TABS.map((t) => (
          <Button
            key={t.value}
            type={status === t.value ? 'primary' : 'default'}
            onClick={() => updateParams({ status: t.value || undefined, page: 1 })}
          >
            {t.label}
          </Button>
        ))}
      </Space>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : orders.length === 0 ? (
        <Empty description="暂无订单" />
      ) : (
        <>
          {orders.map((o) => (
            <Card
              key={o.id}
              style={{ marginBottom: 16 }}
              title={
                <Space>
                  <span>#{o.order_no}</span>
                  <Tag color={ORDER_STATUS_COLOR[o.status]}>{ORDER_STATUS_TEXT[o.status]}</Tag>
                  <span style={{ color: '#999', fontSize: 13 }}>用户：{o.username}</span>
                </Space>
              }
            >
              <div style={{ marginBottom: 12 }}>
                {o.items.map((it) => (
                  <div key={it.id} style={{ color: '#666' }}>
                    {it.product_name} × {it.quantity}
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 12,
                  borderTop: '1px solid #f0f0f0',
                }}
              >
                <span style={{ fontSize: 16 }}>
                  合计：<strong style={{ color: '#ff4d4f' }}>￥{o.total_amount}</strong>
                </span>
                {o.status === 'paid' && (
                  <Button type="primary" onClick={() => handleShip(o.id)}>
                    标记发货
                  </Button>
                )}
              </div>
            </Card>
          ))}

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={pagination.page}
              pageSize={pagination.size}
              total={pagination.total}
              onChange={(p) => updateParams({ page: p })}
              showSizeChanger={false}
            ></Pagination>
          </div>
        </>
      )}
    </div>
  );
}
