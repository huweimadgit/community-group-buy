import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import Echart from '@/components/Echart';
import { adminApi } from '@/api/admin';
import { ORDER_STATUS_TEXT, type OrderStatus } from '@/types/order';

interface Overview {
  user_count: number;
  product_count: number;
  community_count: number;
  total_orders: number;
  total_sales: string;
  pending_orders: number;
}

interface TrendPoint {
  date: string;
  order_count: number;
  sales: number;
}

interface TopProduct {
  product_id: number;
  product_name: string;
  total_quantity: number;
  total_sales: number;
}

interface StatusCount {
  status: OrderStatus;
  count: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [orderStatus, setOrderStatus] = useState<StatusCount[]>([]);

  useEffect(() => {
    Promise.all([
      adminApi.overview(),
      adminApi.salesTrend(7),
      adminApi.topProducts(10),
      adminApi.orderStatus(),
    ])
      .then(([o, t, tp, os]) => {
        setOverview(o);
        setTrend(t);
        setTopProducts(tp);
        setOrderStatus(os);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !overview) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  // 销售趋势折线图
  const trendOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['订单数', '销售额'] },
    grid: { left: 50, right: 50, top: 40, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: trend.map((d) => d.date.slice(5)), // MM-DD
    },
    yAxis: [
      { type: 'value' as const, name: '订单数' },
      { type: 'value' as const, name: '销售额', positon: 'right' as const },
    ],
    series: [
      {
        name: '订单数',
        type: 'bar' as const,
        data: trend.map((d) => d.order_count),
        itemStyle: { color: '#1677ff' },
      },
      {
        name: '销售额',
        type: 'line' as const,
        yAxisIndex: 1,
        data: trend.map((d) => d.sales),
        smooth: true,
        itemStyle: { color: '#ff4d4f' },
      },
    ],
  };

  // 热销 Top10 横向柱状图
  const topOption = {
    tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
    grid: { left: 120, right: 30, top: 20, bottom: 30 },
    xAxis: { type: 'value' as const },
    yAxis: {
      type: 'category' as const,
      data: topProducts.map((p) => p.product_name).reverse(),
    },
    series: [
      {
        type: 'bar' as const,
        data: topProducts.map((p) => p.total_quantity).reverse(),
        itemStyle: { color: '#52c41a' },
        label: { show: true, position: 'right' as const },
      },
    ],
  };

  // 订单状态分布图
  const statusOption = {
    tooltip: { trigger: 'item' as const },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie' as const,
        radius: ['40%', '65%'],
        data: orderStatus.map((s) => ({
          name: ORDER_STATUS_TEXT[s.status] || s.status,
          value: s.count,
        })),
        label: { formatter: '{b}: {c}' },
      },
    ],
  };

  return (
    <div>
      <h2>数据看板</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="注册用户" value={overview.user_count} suffix="人" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="在售商品" value={overview.product_count} suffix="件" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="自提点" value={overview.community_count} suffix="个" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="累计销售额"
              value={Number(overview.total_sales).toFixed(2)}
              prefix="￥"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="近 7 天销售趋势">
            <Echart option={trendOption} height={320} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="订单分布情况">
            <Echart option={statusOption} height={320} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24}>
          <Card title="热销商品 Top 10">
            <Echart option={topOption} height={360} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
