import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const customerRoutes = Router();
const customerController = new CustomerController();

customerRoutes.use(authMiddleware);

customerRoutes.post('/', customerController.create);
customerRoutes.get('/', customerController.list);
customerRoutes.get('/:id', customerController.getById);
customerRoutes.put('/:id', customerController.update);
customerRoutes.delete('/:id', customerController.delete);

export { customerRoutes };
