import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.get('/stats', authMiddleware, DashboardController.getStats);

export { router as dashboardRoutes };
