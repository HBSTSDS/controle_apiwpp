import { Router } from 'express';
import { ReceivableController } from '../controllers/receivable.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const receivableRoutes = Router();
const receivableController = new ReceivableController();

receivableRoutes.use(authMiddleware);

receivableRoutes.get('/', receivableController.list);
receivableRoutes.patch('/:id/pay', receivableController.markAsPaid);

export { receivableRoutes };
