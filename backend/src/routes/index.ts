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
import pipelineRoutes from './pipelineRoutes';
import projectRoutes from './projectRoutes';
import ticketRoutes from './ticketRoutes';
import surveyRoutes from './surveyRoutes';
import healthScoreRoutes from './healthScoreRoutes';
import emailSequenceRoutes from './emailSequenceRoutes';
import automationRoutes from './automationRoutes';

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
router.use('/pipelines', pipelineRoutes);
router.use('/projects', projectRoutes);
router.use('/tickets', ticketRoutes);
router.use('/surveys', surveyRoutes);
router.use('/health-scores', healthScoreRoutes);
router.use('/email-sequences', emailSequenceRoutes);
router.use('/automations', automationRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
