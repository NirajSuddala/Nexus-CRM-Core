import { Router } from 'express';
import {
  getAutomations,
  getAutomation,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  toggleAutomation,
  executeAutomation,
  getAutomationStats,
} from '../controllers/automationController';

const router = Router();

router.get('/', getAutomations);
router.get('/stats', getAutomationStats);
router.get('/:id', getAutomation);
router.post('/', createAutomation);
router.put('/:id', updateAutomation);
router.delete('/:id', deleteAutomation);
router.post('/:id/toggle', toggleAutomation);
router.post('/:id/execute', executeAutomation);

export default router;
