import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useEffect } from 'react';
import MainLayout from '@/layouts/MainLayout';
import Home from '@/pages/Home';
import ProductDetail from '@/pages/product/Detail';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import RequireAuth from '@/components/RequireAuth';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import CartPage from '@/pages/cart/Index';
import Checkout from '@/pages/checkout/Index';
import OrderList from '@/pages/order/Index';
import OrderDetail from '@/pages/order/Detail';

function App() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const fetchCart = useCartStore((s) => s.fetchCart);

  // 应用启动时，如果本地有 token 但没用户信息，拉一次
  useEffect(() => {
    if (token && !user) {
      fetchMe();
    }
    if (token) {
      fetchCart();
    }
  }, [token, user, fetchMe, fetchCart]);

  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="products/:id" element={<ProductDetail />} />

            {/* 需要登录才能访问的页面示例（阶段 7、8 会往里填） */}
            <Route
              path="cart"
              element={
                <RequireAuth>
                  <CartPage />
                </RequireAuth>
              }
            />
            <Route
              path="checkout"
              element={
                <RequireAuth>
                  <Checkout />
                </RequireAuth>
              }
            />
            <Route
              path="orders"
              element={
                <RequireAuth>
                  <OrderList />
                </RequireAuth>
              }
            />
            <Route
              path="orders/:id"
              element={
                <RequireAuth>
                  <OrderDetail />
                </RequireAuth>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
