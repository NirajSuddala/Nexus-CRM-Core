import { Router } from 'express';
import {
  getEmailSequences,
  getEmailSequence,
  createEmailSequence,
  updateEmailSequence,
  deleteEmailSequence,
  getSequenceSteps,
  createSequenceStep,
  updateSequenceStep,
  deleteSequenceStep,
  getEmailTemplates,
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from '../controllers/emailSequenceController';

const router = Router();

// Email sequence routes
router.get('/', getEmailSequences);
router.get('/:id', getEmailSequence);
router.post('/', createEmailSequence);
router.put('/:id', updateEmailSequence);
router.delete('/:id', deleteEmailSequence);

// Sequence step routes
router.get('/:sequenceId/steps', getSequenceSteps);
router.post('/:sequenceId/steps', createSequenceStep);
router.put('/:sequenceId/steps/:stepId', updateSequenceStep);
router.delete('/:sequenceId/steps/:stepId', deleteSequenceStep);

// Email template routes (can also be in a separate file)
router.get('/templates', getEmailTemplates);
router.get('/templates/:id', getEmailTemplate);
router.post('/templates', createEmailTemplate);
router.put('/templates/:id', updateEmailTemplate);
router.delete('/templates/:id', deleteEmailTemplate);

export default router;
