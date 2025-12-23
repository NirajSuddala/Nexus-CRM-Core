import { Router } from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '../controllers/projectController';

const router = Router();

// Project routes
router.get('/', getProjects);
router.get('/:id', getProject);
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Milestone routes
router.get('/:projectId/milestones', getMilestones);
router.post('/:projectId/milestones', createMilestone);
router.put('/:projectId/milestones/:milestoneId', updateMilestone);
router.delete('/:projectId/milestones/:milestoneId', deleteMilestone);

export default router;
