import { Layout, Menu, Button, Space, Dropdown, Avatar, Badge } from 'antd';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCartOutlined,
  UserOutlined,
  HomeOutlined,
  OrderedListOutlined,
  SettingOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

const { Header, Content, Footer } = Layout;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const totalItems = useCartStore((s) => s.totalItems);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 根据角色动态组装菜单
  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">首页</Link> },
    {
      key: '/cart',
      icon: <ShoppingCartOutlined />,
      label: (
        <Link to="/cart">
          <Badge
            count={totalItems}
            size="small"
            offset={[8, 12]}
            styles={{ root: { color: 'rgba(255, 255, 255, 0.65)' } }}
          >
            购物车
          </Badge>
        </Link>
      ),
    },
  ];

  if (user) {
    menuItems.push({
      key: '/orders',
      icon: <OrderedListOutlined />,
      label: <Link to="/orders">我的订单</Link>,
    });
  }

  if (user && user.role === 'admin') {
    menuItems.push(
      {
        key: '/admin',
        icon: <SettingOutlined />,
        label: <Link to="/admin">管理后台</Link>,
      },
      {
        key: '/admin/users',
        icon: <SettingOutlined />,
        label: <Link to="/admin/users">用户管理</Link>,
      },
      {
        key: '/admin/orders',
        icon: <SettingOutlined />,
        label: <Link to="/admin/orders">全局订单</Link>,
      },
    );
  }

  if (user && user.role === 'leader') {
    menuItems.push(
      {
        key: '/leader',
        icon: <CrownOutlined />,
        label: <Link to="/leader">团长中心</Link>,
      },
      {
        key: '/leader/orders',
        icon: <CrownOutlined />,
        label: <Link to="/leader/orders">本团订单</Link>,
      },
      {
        key: '/leader/products',
        icon: <CrownOutlined />,
        label: <Link to="/leader/products">本团商品</Link>,
      },
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" style={{ color: '#fff', fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap' }}>
          社区团购
        </Link>

        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          style={{ flex: 1, minWidth: 0, marginLeft: 24 }}
          items={menuItems}
        />

        <Space>
          {user ? (
            <Dropdown
              menu={{
                items: [{ key: 'logout', label: '退出登录', onClick: handleLogout }],
              }}
            >
              <Space style={{ color: '#fff', cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} src={user.avatar} />
                {user.username}
              </Space>
            </Dropdown>
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
