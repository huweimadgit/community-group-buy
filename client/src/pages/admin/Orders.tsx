import { useEffect, useState } from 'react';
import { Card, Table, Tag, Space, Button, Pagination } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { adminApi } from '@/api/admin';
import { type OrderStatus, ORDER_STATUS_TEXT, ORDER_STATUS_COLOR } from '@/types/order';

interface AdminOrder {
  id: number;
  order_no: string;
  username: string;
  community_name: string;
  total_amount: string;
  status: OrderStatus;
  created_at: string;
}

export default function AdminOrders() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = () => {
    setLoading(true);
    adminApi
      .orders({ status: status || undefined, page, size: 10 })
      .then((data: { list: AdminOrder[]; pagination: { total: number } }) => {
        setOrders(data.list);
        setTotal(data.pagination.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  const columns: ColumnsType<AdminOrder> = [
    { title: '订单号', dataIndex: 'order_no', width: 200 },
    { title: '用户', dataIndex: 'username', width: 120 },
    { title: '自提点', dataIndex: 'community_name' },
    {
      title: '金额',
      dataIndex: 'total_amount',
      render: (v: any) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>￥{v}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: OrderStatus) => <Tag color={ORDER_STATUS_COLOR[v]}>{ORDER_STATUS_TEXT[v]}</Tag>,
    },
    {
      title: '下单时间',
      dataIndex: 'created_at',
      render: (v: any) => new Date(v).toLocaleString(),
    },
  ];

  return (
    <div>
      <h2>全局订单</h2>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          {[
            { value: '', label: '全部' },
            { value: 'pending', label: '待支付' },
            { value: 'paid', label: '待发货' },
            { value: 'shipped', label: '待自提' },
            { value: 'completed', label: '已完成' },
            { value: 'canceled', label: '已取消' },
          ].map((t) => (
            <Button
              key={t.value}
              type={status === t.value ? 'primary' : 'default'}
              onClick={() => {
                setStatus(t.value);
                setPage(1);
              }}
            >
              {t.label}
            </Button>
          ))}
        </Space>

        <Table
          dataSource={orders}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        >
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Pagination
              current={page}
              pageSize={10}
              total={total}
              onChange={setPage}
              showSizeChanger={false}
            ></Pagination>
          </div>
        </Table>
      </Card>
    </div>
  );
}
