import { Router } from 'express';
import { SaleController } from '../controllers/sale.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const saleRoutes = Router();
const saleController = new SaleController();

saleRoutes.use(authMiddleware);

saleRoutes.post('/', saleController.create);
saleRoutes.get('/', saleController.list);

export { saleRoutes };
