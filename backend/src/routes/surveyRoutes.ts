import { Router } from 'express';
import {
  getSurveys,
  getSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getSurveyResponses,
  createSurveyResponse,
  getSurveyStats,
} from '../controllers/surveyController';

const router = Router();

// Survey routes
router.get('/', getSurveys);
router.get('/:id', getSurvey);
router.post('/', createSurvey);
router.put('/:id', updateSurvey);
router.delete('/:id', deleteSurvey);

// Survey response routes
router.get('/:surveyId/responses', getSurveyResponses);
router.post('/:surveyId/responses', createSurveyResponse);
router.get('/:surveyId/stats', getSurveyStats);

export default router;
