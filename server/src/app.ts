import express from 'express';
import cors from 'cors';
import { responseHandler } from './middlewares/response.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseHandler);

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
