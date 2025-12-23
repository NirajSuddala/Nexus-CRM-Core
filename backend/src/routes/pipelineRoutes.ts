import { Router } from 'express';
import {
  getPipelines,
  getPipeline,
  createPipeline,
  updatePipeline,
  deletePipeline,
  getStages,
  createStage,
  updateStage,
  deleteStage,
} from '../controllers/pipelineController';

const router = Router();

// Pipeline routes
router.get('/', getPipelines);
router.get('/:id', getPipeline);
router.post('/', createPipeline);
router.put('/:id', updatePipeline);
router.delete('/:id', deletePipeline);

// Stage routes
router.get('/:pipelineId/stages', getStages);
router.post('/:pipelineId/stages', createStage);
router.put('/:pipelineId/stages/:stageId', updateStage);
router.delete('/:pipelineId/stages/:stageId', deleteStage);

export default router;
