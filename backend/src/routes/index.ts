import { Router } from 'express';
import authRoutes from './authRoutes';
import companyRoutes from './companyRoutes';
import contactRoutes from './contactRoutes';
import dealRoutes from './dealRoutes';
import taskRoutes from './taskRoutes';
import noteRoutes from './noteRoutes';
import dashboardRoutes from './dashboardRoutes';
import searchRoutes from './searchRoutes';
import reportRoutes from './reportRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/contacts', contactRoutes);
router.use('/deals', dealRoutes);
router.use('/tasks', taskRoutes);
router.use('/notes', noteRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/search', searchRoutes);
router.use('/reports', reportRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
