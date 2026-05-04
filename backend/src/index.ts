import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

import { authRoutes } from './routes/auth.routes';
import { customerRoutes } from './routes/customer.routes';
import { productRoutes } from './routes/product.routes';
import { inventoryRoutes } from './routes/inventory.routes';
import { saleRoutes } from './routes/sale.routes';
import { receivableRoutes } from './routes/receivable.routes';
import { uploadRoutes } from './routes/upload.routes';
import path from 'path';

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/receivables', receivableRoutes);
app.use('/api/upload', uploadRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
