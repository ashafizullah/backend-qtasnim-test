// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import express, { Request, Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { connectDB, sequelize } from './config/db';

import productRouter from './routes/product.routes';
import productTypeRouter from './routes/productType.routes';
import transactionRouter from './routes/transaction.routes';

const app = express();

app.use(express.json({ limit: '10kb' }));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
  }),
);

app.get('/api/health-checker', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Backend Qtasnim test is running',
  });
});

app.use('/api/products', productRouter);
app.use('/api/product-types', productTypeRouter);
app.use('/api/transactions', transactionRouter);

app.all('*', (req: Request, res: Response) => {
  res.status(404).json({
    status: 'failed',
    message: `Route: ${req.originalUrl} not found`,
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectDB();
  await sequelize.sync({ force: false }).then(() => {
    console.log('Database connected');
  });
});
