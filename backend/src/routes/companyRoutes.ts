import { Router } from 'express';
import * as companyController from '../controllers/companyController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createCompanySchema, updateCompanySchema } from '../utils/validationSchemas';

const router = Router();

router.use(authenticate);

router.get('/', companyController.getCompanies);
router.get('/:id', companyController.getCompany);
router.post('/', validateBody(createCompanySchema), companyController.createCompany);
router.put('/:id', validateBody(updateCompanySchema), companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);

export default router;
