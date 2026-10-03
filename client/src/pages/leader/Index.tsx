import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { leaderApi } from '@/api/leader';

interface Stats {
  community: { id: number; name: string };
  order_stats: {
    total_orders: number;
    pending_count: number;
    paid_count: number;
    shipped_count: number;
    completed_count: number;
    total_sales: number;
  };
  today_stats: {
    today_orders: number;
    today_sales: number;
  };
}

export default function LeaderHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    leaderApi
      .stats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!stats) {
    return <Empty description="你不是任何社团的团长" />;
  }

  return (
    <div>
      <h2>团中中心 · {stats.community.name}</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="今日订单" value={stats.today_stats.today_orders} suffix="单" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="今日销售额"
              value={Number(stats.today_stats.today_sales ?? 0).toFixed(2)}
              prefix="￥"
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="累计销售额"
              value={Number(stats.order_stats.total_sales ?? 0).toFixed(2)}
              prefix="￥"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card
            title="待处理"
            extra={<a onClick={() => navigate('/leader/orders?stats=paid')}>去发货</a>}
          >
            <p>待发货：{stats.order_stats.paid_count} 单</p>
            <p>待自提：{stats.order_stats.shipped_count} 单</p>
            <p>待支付：{stats.order_stats.pending_count} 单</p>
            <p>已完成：{stats.order_stats.completed_count} 单</p>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title="快捷入口"
            extra={<a onClick={() => navigate('/leader/products')}>管理商品</a>}
          >
            <p>
              <a onClick={() => navigate('/leader/orders')}>查看全部订单</a>
            </p>
            <p>
              <a onClick={() => navigate('/leader/products')}>调整库存与价格</a>
            </p>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
