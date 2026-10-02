import { useEffect, useState } from 'react';
import { Card, Tag, Button, Empty, Spin, Space, Pagination, Popconfirm, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderApi } from '@/api/orders';
import { type Order, type OrderStatus, ORDER_STATUS_TEXT, ORDER_STATUS_COLOR } from '@/types/order';

const STATUS_TABS: { value: string; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '待发货' },
  { value: 'shipped', label: '待自提' },
  { value: 'completed', label: '已完成' },
  { value: 'canceled', label: '已取消' },
];

export default function OrderList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ page: 1, size: 0, total: 0, totalPages: 0 });

  const loadData = () => {
    setLoading(true);
    orderApi
      .list({ status: status || undefined, page, size: 10 })
      .then((data) => {
        setOrders(data.list);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  const updateParams = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === '') params.delete(k);
      else params.set(k, String(v));
    });
    setSearchParams(params);
  };

  const handleAction = async (action: 'pay' | 'cancel' | 'confirm', id: number) => {
    try {
      await orderApi[action](id);
      message.success('操作成功');
      loadData();
    } catch {
      // request.ts 已统一弹错
    }
  };

  return (
    <div>
      <h2>我的订单</h2>

      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            type={status === tab.value ? 'primary' : 'default'}
            onClick={() => updateParams({ status: tab.value || undefined, page: 1 })}
          >
            {tab.label}
          </Button>
        ))}
      </Space>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 0 }}>
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
                  <span>订单号：{o.order_no}</span>
                  <Tag color={ORDER_STATUS_COLOR[o.status as OrderStatus]}>
                    {ORDER_STATUS_TEXT[o.status as OrderStatus]}
                  </Tag>
                </Space>
              }
              extra={
                <span style={{ color: '#999', fontSize: 12 }}>
                  {new Date(o.created_at).toLocaleString()}
                </span>
              }
            >
              <div style={{ marginBottom: 12, color: '#666' }}>自提点：{o.community_name}</div>

              {o.items.map((it) => (
                <div
                  key={it.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    color: '#666',
                  }}
                >
                  <span>
                    {it.product_name} × {it.quantity}
                  </span>
                  <span>￥{it.subtotal}</span>
                </div>
              ))}

              <div
                style={{
                  textAlign: 'right',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid #f0f0f0',
                }}
              >
                <span style={{ marginRight: 12 }}>
                  合计：
                  <strong style={{ color: '#ff4d4f', fontSize: 18 }}>￥{o.total_amount}</strong>
                </span>
                <Space>
                  <Button onClick={() => navigate(`/orders/${o.id}`)}>详情</Button>
                  {o.status === 'pending' && (
                    <>
                      <Popconfirm
                        title="确定取消订单？"
                        onConfirm={() => handleAction('cancel', o.id)}
                      >
                        <Button>取消</Button>
                      </Popconfirm>
                      <Button type="primary" onClick={() => handleAction('pay', o.id)}>
                        支付
                      </Button>
                    </>
                  )}
                </Space>
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
