import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Spin,
  Empty,
  Space,
  Tag,
  message,
  Rate,
  Avatar,
  Pagination,
} from 'antd';
import { ArrowLeftOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import { productApi } from '@/api/products';
import type { Product } from '@/types/product';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { reviewApi, type ProductReviewResult } from '@/api/reviews';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  const user = useAuthStore((s) => s.user);
  const addToCart = useCartStore((s) => s.addToCart);
  const [, setAdding] = useState(false);

  const [reviews, setReviews] = useState<ProductReviewResult | null>(null);
  const [reviewPage, setReviewPage] = useState(1);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productApi
      .detail(Number(id))
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));

    reviewApi
      .byProduct(Number(id), { page: reviewPage, size: 5 })
      .then(setReviews)
      .catch(() => setReviews(null));
  }, [id, reviewPage]);

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

      <Card
        title={`用户评价${reviews?.avg_rating ? `（平均${reviews.avg_rating}分）` : ''}`}
        style={{ marginTop: 24 }}
      >
        {!reviews || reviews.list.length === 0 ? (
          <Empty description="暂无评价" />
        ) : (
          <>
            {reviews.list.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: '16px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <Avatar src={r.avatar} icon={<UserOutlined />} size="small" />
                  <span style={{ marginLeft: 8 }}>{r.username}</span>
                  <span style={{ marginLeft: 16, color: '#999', fontSize: 12 }}>
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                <Rate disabled value={r.rating} style={{ fontSize: 13 }} />
                {r.content && <div style={{ marginTop: 8 }}>{r.content}</div>}
                {r.images && r.images.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {r.images.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt=""
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 4,
                        }}
                      />
                    ))}
                  </div>
                )}
                {r.video_url && (
                  <video
                    src={r.video_url}
                    controls
                    style={{ marginTop: 8, maxWidth: 320, borderRadius: 4 }}
                  />
                )}
              </div>
            ))}

            {reviews.pagination.totalPages > 1 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Pagination
                  current={reviews.pagination.page}
                  pageSize={reviews.pagination.size}
                  total={reviews.pagination.total}
                  onChange={setReviewPage}
                  showSizeChanger={false}
                ></Pagination>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
