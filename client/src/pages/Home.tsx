import { useEffect, useState } from 'react';
import { Card, Row, Col, Input, Pagination, Empty, Spin, Tag, Button, Space, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productApi } from '@/api/products';
import { categoryApi } from '@/api/categories';
import type { Product, Pagination as PaginationType } from '@/types/product';
import type { Category } from '@/types/category';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

const { Search } = Input;

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const user = useAuthStore((s) => s.user);
  const addToCart = useCartStore((s) => s.addToCart);
  const [adding, setAdding] = useState<number | null>(null); // 那个商品正在加

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    size: 8,
    total: 0,
    totalPages: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);

  // 从 URL 读取筛选条件
  const page = Number(searchParams.get('page')) || 1;
  const categoryId = searchParams.get('category_id')
    ? Number(searchParams.get('category_id'))
    : undefined;
  const keyword = searchParams.get('keyword') || '';

  // 加载分类
  useEffect(() => {
    categoryApi
      .tree()
      .then(setCategories)
      .catch(() => {});
  }, []);

  // 加载商品
  useEffect(() => {
    setLoading(true);
    productApi
      .list({ page, size: 8, category_id: categoryId, keyword })
      .then((data) => {
        setProducts(data.list);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  }, [page, categoryId, keyword]);

  // 更新 URL 参数（这样刷新页面筛选还在）
  const updateParams = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === null) {
        params.delete(k);
      } else {
        params.set(k, String(v));
      }
    });
    setSearchParams(params);
  };

  const handleCategoryClick = (id: number | undefined) => {
    updateParams({ category_id: id, page: 1 });
  };

  const handleSearch = (value: string) => {
    updateParams({ keyword: value.trim() || undefined, page: 1 });
  };

  const handlePageChange = (p: number) => {
    updateParams({ page: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        {/* 搜索栏 */}
        <Search
          placeholder="搜索商品名称"
          defaultValue={keyword}
          onSearch={handleSearch}
          allowClear
          style={{ maxWidth: 400 }}
        />

        {/* 分类筛选 */}
        <div>
          <Tag
            color={categoryId === undefined ? 'blue' : 'default'}
            style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }}
            onClick={() => handleCategoryClick(undefined)}
          >
            全部
          </Tag>
          {categories.map((c) => (
            <Tag
              key={c.id}
              color={categoryId === c.id ? 'blue' : 'default'}
              style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }}
              onClick={() => handleCategoryClick(c.id)}
            >
              {c.name}
            </Tag>
          ))}
        </div>

        {/* 商品列表 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : products.length === 0 ? (
          <Empty description="没有找到商品" />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {products.map((p) => (
                <Col xs={24} sm={12} md={8} lg={6} key={p.id}>
                  <Card
                    hoverable
                    onClick={() => navigate(`/products/${p.id}`)}
                    cover={
                      p.cover_url ? (
                        <img
                          alt={p.name}
                          src={p.cover_url}
                          style={{ height: 180, objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            height: 180,
                            background: '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                          }}
                        >
                          暂无图片
                        </div>
                      )
                    }
                  >
                    <Card.Meta
                      title={p.name}
                      description={
                        <>
                          <div style={{ color: '#999', fontSize: 12 }}>{p.category_name}</div>
                          <div
                            style={{
                              marginTop: 8,
                              color: '#ff4d4f',
                              fontSize: 18,
                              fontWeight: 600,
                            }}
                          >
                            ¥{p.price}
                            <span style={{ fontSize: 12, color: '#999', fontWeight: 400 }}>
                              {' '}
                              / {p.unit}
                            </span>
                          </div>
                        </>
                      }
                    />
                    <Button
                      type="primary"
                      block
                      style={{ marginTop: 12 }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!user) {
                          message.warning('请先登录');
                          navigate('/login', { state: { from: '/' } });
                          return;
                        }
                        setAdding(p.id);
                        await addToCart({ product_id: p.id, community_id: 1, quantity: 1 });
                        setAdding(null);
                      }}
                      loading={adding === p.id}
                    >
                      加入购物车
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Pagination
                current={pagination.page}
                pageSize={pagination.size}
                total={pagination.total}
                onChange={handlePageChange}
                showSizeChanger={false}
                showTotal={(t) => `共 ${t} 件商品`}
              />
            </div>
          </>
        )}
      </Space>
    </div>
  );
}
