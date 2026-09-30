import { Form, Input, Button, Card, message } from 'antd';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import type { LoginParams } from '@/api/auth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);

  const onFinish = async (values: LoginParams) => {
    try {
      await login(values);
      message.success('登录成功');
      // 如果之前被守卫拦下，跳回原页面
      const from = (location.state as { from?: string } | null)?.from || '/';
      navigate(from, { replace: true });
    } catch {
      // request.ts 里已统一弹错误提示
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
      <Card title="登录" style={{ width: 360 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            还没有账号？<Link to="/register">去注册</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
