import { useEffect, useMemo } from 'react';
import { Card, InputNumber, Button, Empty, Spin, Space, Typography, Popconfirm } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cart';

const { Title } = Typography;

export default function CartPage() {
  const navigate = useNavigate();
  const { groups, totalItems, loading, fetchCart, updateQuantity, removeItem, clear } =
    useCartStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const totalPrice = useMemo(() => {
    return groups.reduce((sum, g) => {
      return sum + g.items.reduce((s, item) => s + Number(item.price) * item.quantity, 0);
    }, 0);
  }, [groups]);

  if (loading && groups.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Empty description="购物车是空的">
        <Button type="primary" onClick={() => navigate('/')}>
          去逛逛
        </Button>
      </Empty>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          购物车（{totalItems} 件）
        </Title>
        <Popconfirm title="确定清空购物车？" onConfirm={clear}>
          <Button danger>清空</Button>
        </Popconfirm>
      </div>

      {groups.map((group) => (
        <Card
          key={group.community_id}
          title={`自提点：${group.community_name}`}
          style={{ marginBottom: 16 }}
        >
          {group.items.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 0',
                borderTop: idx === 0 ? 'none' : '1px solid #f0f0f0',
              }}
            >
              {/* 图片 */}
              <div style={{ flexShrink: 0 }}>
                {item.cover_url ? (
                  <img
                    src={item.cover_url}
                    alt={item.name}
                    style={{
                      width: 72,
                      height: 72,
                      objectFit: 'cover',
                      borderRadius: 6,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      background: '#f0f0f0',
                      borderRadius: 6,
                    }}
                  />
                )}
              </div>

              {/* 名称 + 单价 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{item.name}</div>
                <div style={{ color: '#ff4d4f', fontWeight: 600 }}>
                  ¥{item.price} / {item.unit}
                </div>
              </div>

              {/* 数量 */}
              <InputNumber
                min={1}
                max={item.stock}
                value={item.quantity}
                onChange={(v) => {
                  if (typeof v === 'number' && v !== item.quantity) {
                    updateQuantity(item.id, v);
                  }
                }}
              />

              {/* 小计 */}
              <div
                style={{
                  minWidth: 100,
                  textAlign: 'right',
                  color: '#666',
                }}
              >
                小计
                <div style={{ color: '#333', fontWeight: 600 }}>
                  ¥{(Number(item.price) * item.quantity).toFixed(2)}
                </div>
              </div>

              {/* 删除 */}
              <Popconfirm title="删除这一项？" onConfirm={() => removeItem(item.id)}>
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </div>
          ))}
        </Card>
      ))}

      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: 16 }}>总计：</span>
            <span
              style={{
                fontSize: 24,
                color: '#ff4d4f',
                fontWeight: 600,
              }}
            >
              ¥{totalPrice.toFixed(2)}
            </span>
          </div>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={() => navigate('/checkout')}
            >
              去结算
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}
