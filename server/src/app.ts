import express from 'express';
import cors from 'cors';
import { responseHandler } from './middlewares/response.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import uploadRouter from './routes/upload.js';
import cartRouter from './routes/cart.js';
import orderRouter from './routes/orders.js';
import leaderRouter from './routes/leader.js';
import adminRouter from './routes/admin.js';
import reviewsRouter from './routes/reviews.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseHandler);

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/leader', leaderRouter);
app.use('/api/admin', adminRouter);
app.use('/api/reviews', reviewsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
