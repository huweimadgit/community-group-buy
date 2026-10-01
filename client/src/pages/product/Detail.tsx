import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Spin, Empty, Space, Tag, message } from 'antd';
import { ArrowLeftOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { productApi } from '@/api/products';
import type { Product } from '@/types/product';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  const user = useAuthStore((s) => s.user);
  const addToCart = useCartStore((s) => s.addToCart);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productApi
      .detail(Number(id))
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!product) {
    return <Empty description="商品不存在或已下架" />;
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <Card>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {/* 图片区 */}
          <div style={{ flex: '0 0 400px', minWidth: 280 }}>
            {product.video_url ? (
              <video
                src={product.video_url}
                controls
                poster={product.cover_url ?? undefined}
                style={{ width: '100%', borderRadius: 8 }}
              />
            ) : product.cover_url ? (
              <img
                src={product.cover_url}
                alt={product.name}
                style={{ width: '100%', borderRadius: 8 }}
              />
            ) : (
              <div
                style={{
                  height: 320,
                  background: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  borderRadius: 8,
                }}
              >
                暂无图片
              </div>
            )}
          </div>

          {/* 信息区 */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <h2 style={{ marginTop: 0 }}>{product.name}</h2>
            <Space style={{ marginBottom: 16 }}>
              <Tag color="blue">{product.category_name}</Tag>
              {product.status === 'off' && <Tag color="red">已下架</Tag>}
            </Space>

            <div
              style={{
                fontSize: 32,
                color: '#ff4d4f',
                fontWeight: 600,
                margin: '16px 0',
              }}
            >
              ¥{product.price}
              <span style={{ fontSize: 14, color: '#999', fontWeight: 400 }}>
                {' '}
                / {product.unit}
              </span>
            </div>

            <Descriptions column={1} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="商品描述">
                {product.description || '暂无描述'}
              </Descriptions.Item>
            </Descriptions>

            <Space size="large">
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={async () => {
                  if (!user) {
                    message.warning('请先登录');
                    navigate('/login', { state: { from: `/products/${product.id}` } });
                    return;
                  }
                  setAdding(true);
                  await addToCart({ product_id: product.id, community_id: 1, quantity: 1 });
                  setAdding(false);
                }}
              >
                加入购物车
              </Button>
            </Space>
          </div>
        </div>
      </Card>
    </div>
  );
}
