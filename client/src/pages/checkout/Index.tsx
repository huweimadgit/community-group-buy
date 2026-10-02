import { useEffect, useState } from 'react';
import { Card, Button, Input, Space, Typography, Divider, message, Empty, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cart';
import { orderApi } from '@/api/orders';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function Checkout() {
  const navigate = useNavigate();
  const { groups, totalItems, loading, fetchCart } = useCartStore();
  const [submitting, setSubmitting] = useState(false);
  const [remark, setRemark] = useState('');

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const totalPrice = groups.reduce(
    (sum, g) => sum + g.items.reduce((s, it) => s + Number(it.price) * it.quantity, 0),
    0,
  );

  // 目前只允许单社区计算（多社区要拆成多个订单）
  const currentGroup = groups[0];

  const handleSubmit = async () => {
    if (!currentGroup) {
      message.warning('购物车为空');
      return;
    }
    setSubmitting(true);
    try {
      const result = await orderApi.create({
        community_id: currentGroup.community_id,
        remark: remark || undefined,
      });
      message.success('下单成功');
      await fetchCart(); // 刷新购物车（结算后会被清空）
      navigate(`/order/${result.order_id}`);
    } catch {
      // request.ts 已统一弹错
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <Empty description="购物车为空">
        <Button type="primary" onClick={() => navigate('/')}>
          去逛逛
        </Button>
      </Empty>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={4}>确定订单</Title>

      <Card title={`自提点：${currentGroup.community_name}`} style={{ marginBottom: 16 }}>
        {currentGroup.items.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 0',
              gap: 12,
            }}
          >
            {item.cover_url ? (
              <img
                src={item.cover_url ?? ''}
                alt={item.name}
                style={{
                  width: 56,
                  height: 56,
                  objectFit: 'cover',
                  borderRadius: 4,
                  background: '#f0f0f0',
                }}
              />
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 4,
                  background: '#f0f0f0',
                }}
              ></div>
            )}
            <div style={{ flex: 1 }}>
              <div>{item.name}</div>
              <Text type="secondary">
                ￥{item.price} / {item.unit} × {item.quantity}
              </Text>
            </div>
            <div style={{ color: '#ff4d4f', fontWeight: 600 }}>
              ￥{(Number(item.price) * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </Card>

      <Card title="备注" style={{ marginBottom: 16 }}>
        <TextArea
          rows={3}
          maxLength={200}
          showCount
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="有什么特殊要求告诉团长（选填）"
        ></TextArea>
      </Card>

      <Card>
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>商品件数：</Text>
            <Text>{totalItems} 件</Text>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 16 }}>应付总额：</Text>
            <Text style={{ fontSize: 14, color: '#ff4d4f', fontWeigth: 600 }}>
              ￥{totalPrice.toFixed(2)}
            </Text>
          </div>
          <Button type="primary" size="large" block loading={submitting} onClick={handleSubmit}>
            提交订单
          </Button>
        </Space>
      </Card>
    </div>
  );
}
