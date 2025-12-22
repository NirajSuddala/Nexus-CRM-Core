import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Deal Reports
router.get('/deals/by-stage', reportController.getDealsByStageReport);
router.get('/deals/value-over-time', reportController.getDealValueOverTime);
router.get('/deals/win-loss', reportController.getWinLossReport);
router.get('/deals/forecast', reportController.getSalesForecast);

// Contact Reports
router.get('/contacts/by-lifecycle', reportController.getContactsByLifecycleReport);
router.get('/contacts/growth', reportController.getContactGrowth);
router.get('/contacts/by-company', reportController.getContactsByCompany);

// Activity Reports
router.get('/tasks/completion', reportController.getTaskCompletionReport);
router.get('/activity-log', reportController.getActivityLog);

export default router;
