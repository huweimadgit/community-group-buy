import express from 'express';
import cors from 'cors';
import { responseHandler } from './middlewares/response.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { UPLOAD_DIR_PATH } from './middlewares/upload.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import uploadRouter from './routes/upload.js';
import cartRouter from './routes/cart.js';
import orderRouter from './routes/orders.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseHandler);

// 静态文件服务：/uploads/xxx.jpg 直接返回文件
app.use('/uploads', express.static(UPLOAD_DIR_PATH));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
