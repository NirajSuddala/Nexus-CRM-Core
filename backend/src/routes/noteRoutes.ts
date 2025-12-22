import { Router } from 'express';
import * as noteController from '../controllers/noteController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createNoteSchema, updateNoteSchema } from '../utils/validationSchemas';

const router = Router();

router.use(authenticate);

router.get('/', noteController.getNotes);
router.get('/:id', noteController.getNote);
router.post('/', validateBody(createNoteSchema), noteController.createNote);
router.put('/:id', validateBody(updateNoteSchema), noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

export default router;
