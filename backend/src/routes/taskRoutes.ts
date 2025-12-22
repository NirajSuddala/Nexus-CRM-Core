import { Router } from 'express';
import * as taskController from '../controllers/taskController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createTaskSchema, updateTaskSchema } from '../utils/validationSchemas';

const router = Router();

router.use(authenticate);

router.get('/', taskController.getTasks);
router.get('/upcoming', taskController.getUpcomingTasks);
router.get('/overdue', taskController.getOverdueTasks);
router.get('/stats', taskController.getTaskStats);
router.get('/:id', taskController.getTask);
router.post('/', validateBody(createTaskSchema), taskController.createTask);
router.put('/:id', validateBody(updateTaskSchema), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

export default router;
