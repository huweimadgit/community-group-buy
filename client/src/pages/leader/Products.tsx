import { useEffect, useState } from 'react';
import { Card, Table, InputNumber, Button, Spin, message, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { leaderApi } from '@/api/leader';

interface LeaderProduct {
  cp_id: number;
  product_id: number;
  name: string;
  cover_url: string | null;
  unit: string;
  status: string;
  base_price: string;
  community_price: string;
  stock: number;
  category_name: string;
}

export default function LeaderProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<LeaderProduct[]>([]);
  const [editing, setEditing] = useState<Record<number, { stock?: number; price?: number }>>({});

  const load = () => {
    setLoading(true);
    leaderApi
      .products()
      .then((data: { list: LeaderProduct[] }) => setProducts(data.list))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (p: LeaderProduct) => {
    const edit = editing[p.cp_id] || {};
    const payload: { stock?: number; price?: number } = {};
    if (edit.stock !== undefined && edit.stock !== p.stock) payload.stock = edit.stock;
    if (edit.price !== undefined && Number(edit.price) !== Number(p.community_price)) {
      payload.price = edit.price;
    }
    if (Object.keys(payload).length === 0) {
      message.info('没有修改');
      return;
    }
    try {
      await leaderApi.updateProduct(p.cp_id, payload);
      message.success('已保存');
      setEditing((prev) => {
        const next = { ...prev };
        delete next[p.cp_id];
        return next;
      });
      load();
    } catch {
      // 已提示
    }
  };

  const columns: ColumnsType<LeaderProduct> = [
    {
      title: '商品',
      dataIndex: 'name',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {r.cover_url ? (
            <img
              src={r.cover_url}
              alt={r.name}
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
            />
          ) : (
            <div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: 4 }}></div>
          )}
          <div>
            <div>{r.name}</div>
            <Tag color="blue">{r.category_name}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: '平台价',
      dataIndex: 'base_price',
      render: (v: string) => `￥${v} / ${''}`,
    },
    {
      title: '本团价',
      dataIndex: 'community_price',
      render: (v: string, r) => (
        <InputNumber
          min={0.01}
          step={0.1}
          precision={2}
          value={editing[r.cp_id]?.price ?? Number(v)}
          onChange={(nv) =>
            setEditing((prev) => ({
              ...prev,
              [r.cp_id]: { ...prev[r.cp_id], price: nv as number },
            }))
          }
          formatter={(value) => `￥ ${value}`}
          parser={(value) => value?.replace(/¥\s?/g, '') as unknown as number}
        />
      ),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      render: (v: number, r) => (
        <InputNumber
          min={0}
          precision={0}
          value={editing[r.cp_id]?.stock ?? v}
          onChange={(nv) =>
            setEditing((prev) => ({
              ...prev,
              [r.cp_id]: { ...prev[r.cp_id], stock: nv as number },
            }))
          }
        />
      ),
    },
    {
      title: '操作',
      render: (_, r) => (
        <Button type="primary" size="small" onClick={() => handleSave(r)}>
          保存
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <h2>本团商品管理</h2>
      <Card>
        <Table
          dataSource={products}
          columns={columns}
          rowKey="cp_id"
          pagination={{ pageSize: 10 }}
        ></Table>
      </Card>
    </div>
  );
}
