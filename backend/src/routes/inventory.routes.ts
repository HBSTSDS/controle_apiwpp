import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const inventoryRoutes = Router();
const inventoryController = new InventoryController();

inventoryRoutes.use(authMiddleware);

inventoryRoutes.post('/adjust', inventoryController.adjust);
inventoryRoutes.get('/history', inventoryController.history);

export { inventoryRoutes };
