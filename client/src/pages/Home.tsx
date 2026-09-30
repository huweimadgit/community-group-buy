import { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Spin } from 'antd';
import request from '@/utils/request';

interface Product {
  id: number;
  name: string;
  price: string;
  cover_url: string | null;
  category_name?: string;
}

interface ListResult {
  list: Product[];
  pagination: { page: number; size: number; total: number; totalPages: number };
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ListResult | null>(null);

  useEffect(() => {
    request
      .get<{ data: ListResult }>('/products?page=1&size=8')
      .then((r) => setData(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>商品列表</h2>
      {loading ? (
        <Spin />
      ) : (
        <Row gutter={[16, 16]}>
          {data?.list.map((p) => (
            <Col xs={24} sm={12} md={8} lg={6} key={p.id}>
              <Card
                title={p.name}
                cover={
                  p.cover_url ? (
                    <img
                      alt={p.name}
                      src={p.cover_url}
                      style={{ height: 160, objectFit: 'cover' }}
                    />
                  ) : null
                }
              >
                <p>分类：{p.category_name}</p>
                <p>
                  价格：<strong>¥{p.price}</strong>
                </p>
                <Button type="primary">加入购物车</Button>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
