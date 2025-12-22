import { Router } from 'express';
import * as contactController from '../controllers/contactController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createContactSchema, updateContactSchema } from '../utils/validationSchemas';

const router = Router();

router.use(authenticate);

router.get('/', contactController.getContacts);
router.get('/:id', contactController.getContact);
router.post('/', validateBody(createContactSchema), contactController.createContact);
router.put('/:id', validateBody(updateContactSchema), contactController.updateContact);
router.delete('/:id', contactController.deleteContact);

export default router;
