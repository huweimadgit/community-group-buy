import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Spin,
  Empty,
  Space,
  Popconfirm,
  message,
  Divider,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { orderApi } from '@/api/orders';
import { type Order, type OrderStatus, ORDER_STATUS_TEXT, ORDER_STATUS_COLOR } from '@/types/order';
import { useAuthStore } from '@/store/auth';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    orderApi
      .detail(Number(id))
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAction = async (action: 'pay' | 'cancel' | 'confirm' | 'ship') => {
    try {
      await orderApi[action](Number(id));
      message.success('操作成功');
      load();
    } catch {
      // 已统一弹错
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) return <Empty description="订单不存在" />;

  const isLeaderOrAdmin = user?.role === 'leader' || user?.role === 'admin';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <Card
        title={
          <Space>
            <span>订单号：{order.order_no}</span>
            <Tag color={ORDER_STATUS_COLOR[order.status as OrderStatus]}>
              {ORDER_STATUS_TEXT[order.status as OrderStatus]}
            </Tag>
          </Space>
        }
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="下单时间">
            {new Date(order.created_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="自提点">{order.community_name}</Descriptions.Item>
          {order.remark && <Descriptions.Item label="备注">{order.remark}</Descriptions.Item>}
          {order.paid_at && (
            <Descriptions.Item label="支付时间">
              {new Date(order.paid_at).toLocaleString()}
            </Descriptions.Item>
          )}
        </Descriptions>

        <Divider>商品清单</Divider>

        {order.items.map((it) => (
          <div
            key={it.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
            }}
          >
            <div>
              <div>{it.product_name}</div>
              <div style={{ color: '#999', fontSize: 12 }}>
                ￥{it.product_price} × {it.quantity}
              </div>
            </div>
            <div style={{ color: '#ff4d4f', fontWeight: 600 }}>￥{it.subtotal}</div>
          </div>
        ))}

        <Divider />

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ marginRight: 12 }}>订单总额：</span>
          <span style={{ fontSize: 24, color: '#ff4d4f', fontWeight: 600 }}>
            ￥{order.total_amount}
          </span>
        </div>

        <Space>
          {order.status === 'pending' && (
            <>
              <Popconfirm title="确定取消？" onConfirm={() => handleAction('cancel')}>
                <Button>取消订单</Button>
              </Popconfirm>
              <Button type="primary" onClick={() => handleAction('pay')}>
                立即支付
              </Button>
            </>
          )}
          {order.status === 'shipped' && (
            <Button type="primary" onClick={() => handleAction('confirm')}>
              确认收货
            </Button>
          )}
          {order.status === 'paid' && (
            <Button type="primary" onClick={() => handleAction('ship')}>
              发货（团长操作）
            </Button>
          )}
          {order.status === 'completed' && (
            <Button type="primary" onClick={() => navigate(`/orders/${order.id}/review`)}>
              去评价
            </Button>
          )}
        </Space>
      </Card>
    </div>
  );
}
