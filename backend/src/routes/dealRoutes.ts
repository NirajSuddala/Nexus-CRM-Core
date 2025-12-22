import { Router } from 'express';
import * as dealController from '../controllers/dealController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createDealSchema, updateDealSchema, updateDealStageSchema } from '../utils/validationSchemas';

const router = Router();

router.use(authenticate);

router.get('/', dealController.getDeals);
router.get('/by-stage', dealController.getDealsByStage);
router.get('/:id', dealController.getDeal);
router.post('/', validateBody(createDealSchema), dealController.createDeal);
router.put('/:id', validateBody(updateDealSchema), dealController.updateDeal);
router.patch('/:id/stage', validateBody(updateDealStageSchema), dealController.updateDealStage);
router.delete('/:id', dealController.deleteDeal);

export default router;
