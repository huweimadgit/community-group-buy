import axios, { AxiosError } from 'axios';
import { message } from 'antd';

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器：自动带 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器：统一处理 code
request.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse;
    if (body.code === 0) {
      return response;
    }
    message.error(body.message || '请求失败');
    return Promise.reject(new Error(body.message || '请求失败'));
  },
  (error: AxiosError<ApiResponse>) => {
    const status = error.response?.status;
    const body = error.response?.data;

    if (status === 401) {
      localStorage.removeItem('token');
      // 不在这里跳转，避免循环；由路由守卫处理
      message.error('登录已过期，请重新登录');
    } else if (body?.message) {
      message.error(body.message);
    } else {
      message.error(error.message || '网络异常');
    }
    return Promise.reject(error);
  },
);

export default request;
