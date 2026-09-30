import { Layout, Menu, Button, Space } from 'antd';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCartOutlined, UserOutlined, HomeOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/auth';

const { Header, Content, Footer } = Layout;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>社区团购</div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          style={{ flex: 1, minWidth: 0, marginLeft: 24 }}
          items={[
            { key: '/', icon: <HomeOutlined />, label: <Link to="/">首页</Link> },
            {
              key: '/cart',
              icon: <ShoppingCartOutlined />,
              label: <Link to="/cart">购物车</Link>,
            },
          ]}
        />
        <Space>
          {user ? (
            <>
              <span style={{ color: '#fff' }}>
                <UserOutlined /> {user.username}（{user.role}）
              </span>
              <Button onClick={handleLogout}>退出</Button>
            </>
          ) : (
            <>
              <Button type="primary" onClick={() => navigate('/login')}>
                登录
              </Button>
              <Button onClick={() => navigate('/register')}>注册</Button>
            </>
          )}
        </Space>
      </Header>
      <Content style={{ padding: '24px 48px' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center' }}>社区团购 ©2026</Footer>
    </Layout>
  );
}
