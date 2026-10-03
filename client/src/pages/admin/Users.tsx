import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Popconfirm, message, Space, Pagination } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { adminApi } from '@/api/admin';

interface UserRow {
  id: number;
  username: string;
  phone: string | null;
  role: 'user' | 'leader' | 'admin';
  status: 'active' | 'banned';
  created_at: string;
}

const ROLE_TEXT = { user: '普通用户', leader: '团长', admin: '管理员' };
const ROLE_COLOR = { user: 'default', leader: 'blue', admin: 'red' };

export default function AdminUsers() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [role, setRole] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = () => {
    setLoading(true);
    adminApi
      .users({ role: role || undefined, page, size: 10 })
      .then((data: { list: UserRow[]; pagination: { total: number } }) => {
        setUsers(data.list);
        setTotal(data.pagination.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, page]);

  const toggleStatus = async (u: UserRow) => {
    const next = u.status === 'active' ? 'banned' : 'active';
    try {
      await adminApi.updateUserStatus(u.id, next);
      message.success(next === 'banned' ? '已封禁' : '已解封');
      load();
    } catch {
      // 已提示
    }
  };

  const columns: ColumnsType<UserRow> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '用户名', dataIndex: 'useranme' },
    { title: '手机号', dataIndex: 'phone', render: (v: any) => v || '-' },
    {
      title: '角色',
      dataIndex: 'role',
      render: (v: UserRow['role']) => <Tag color={ROLE_COLOR[v]}>{ROLE_TEXT[v]}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: any) =>
        v === 'active' ? <Tag color="green">正常</Tag> : <Tag color="red">已封禁</Tag>,
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      render: (v: any) => new Date(v).toLocaleString(),
    },
    {
      title: '操作',
      render: (_: any, r: any) =>
        r.role === 'admin' ? (
          <span style={{ color: '#999' }}>-</span>
        ) : (
          <Popconfirm
            title={r.status === 'active' ? '确定封禁？' : '确定解封？'}
            onConfirm={() => toggleStatus(r)}
          >
            <Button danger={r.status === 'active'} size="small">
              {r.status === 'active' ? '封禁' : '解封'}
            </Button>
          </Popconfirm>
        ),
    },
  ];

  return (
    <div>
      <h2>用户管理</h2>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          {[
            { value: '', label: '全部' },
            { value: 'user', label: '普通用户' },
            { value: 'leader', label: '团长' },
            { value: 'admin', label: '管理员' },
          ].map((t) => (
            <Button
              key={t.value}
              type={role === t.value ? 'primary' : 'default'}
              onClick={() => {
                setRole(t.value);
                setPage(1);
              }}
            >
              {t.label}
            </Button>
          ))}
        </Space>

        <Table
          dataSource={users}
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
