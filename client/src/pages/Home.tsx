import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Pagination,
  Empty,
  Tag,
  Button,
  Space,
  message,
  Carousel,
  Skeleton,
} from 'antd';
import { PictureOutlined } from '@ant-design/icons';
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

  const [history, setHistory] = useState<string[]>(['苹果', '鸡蛋']);
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
    setHistory([value, ...history.filter((h) => h !== value)].slice(0, 5));
  };

  const handlePageChange = (p: number) => {
    updateParams({ page: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        {/* 顶部轮播图 */}
        <Carousel autoplay style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
          <div>
            <img
              src="/images/banana.jpg"
              style={{ width: '100%', height: 260, objectFit: 'cover' }}
              alt="banana"
            />
          </div>
          <div>
            <img
              src="/images/apple.jpg"
              style={{ width: '100%', height: 260, objectFit: 'cover' }}
              alt="apple"
            />
          </div>
          <div>
            <img
              src="/images/egg.jpg"
              style={{ width: '100%', height: 260, objectFit: 'cover' }}
              alt="egg"
            />
          </div>
        </Carousel>

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
          <Row gutter={[16, 16]}>
            {[1, 2, 3, 4].map((item) => (
              <Col xs={24} sm={12} md={8} lg={6} key={item}>
                <Card styles={{ body: { padding: 0 } }}>
                  {/* 图片占位区域：Flex 居中 + 扫光背景 */}
                  <div
                    style={{
                      width: '100%',
                      height: 180,
                      backgroundColor: '#f0f2f5', // 统一底色
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex', // Flex 布局
                      alignItems: 'center', // 垂直居中
                      justifyContent: 'center', // 水平居中
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                    }}
                  >
                    {/* 1. 扫光动画层 */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
                        transform: 'translateX(-100%)',
                        animation: 'shimmer 1.5s infinite',
                      }}
                    />

                    {/* 2. 居中的图片图标（它会浮在动画层上面） */}
                    <PictureOutlined
                      style={{ fontSize: 48, color: '#bfbfbf', position: 'relative', zIndex: 1 }}
                    />

                    {/* 3. 动画关键帧 */}
                    <style>
                      {`
                        @keyframes shimmer {
                          100% { transform: translateX(100%); }
                        }
                      `}
                    </style>
                  </div>

                  {/* 下方的文字描述仍然使用 Antd 的 Skeleton */}
                  <div style={{ padding: '16px' }}>
                    <Skeleton active title={false} paragraph={{ rows: 2 }} />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
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
