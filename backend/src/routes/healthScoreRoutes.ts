import { Router } from 'express';
import {
  getHealthScores,
  getHealthScore,
  getCompanyHealthScore,
  createHealthScore,
  updateHealthScore,
  recalculateHealthScore,
  getHealthScoreStats,
} from '../controllers/healthScoreController';

const router = Router();

router.get('/', getHealthScores);
router.get('/stats', getHealthScoreStats);
router.get('/company/:companyId', getCompanyHealthScore);
router.post('/company/:companyId/recalculate', recalculateHealthScore);
router.get('/:id', getHealthScore);
router.post('/', createHealthScore);
router.put('/:id', updateHealthScore);

export default router;
