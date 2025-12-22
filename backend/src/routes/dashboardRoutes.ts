import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', dashboardController.getDashboardStats);
router.get('/deals-by-stage', dashboardController.getDealsByStageStats);
router.get('/contacts-by-lifecycle', dashboardController.getContactsByLifecycleStats);
router.get('/recent-deals', dashboardController.getRecentDeals);
router.get('/win-loss-over-time', dashboardController.getWinLossOverTime);

export default router;
