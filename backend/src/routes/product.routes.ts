import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const productRoutes = Router();
const productController = new ProductController();

productRoutes.use(authMiddleware);

productRoutes.post('/', productController.create);
productRoutes.post('/bulk', productController.bulkCreate);
productRoutes.get('/', productController.list);

export { productRoutes };
