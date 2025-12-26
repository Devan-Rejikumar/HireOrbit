import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { IndustryCategoryController } from '../controllers/IndustryCategoryController';
import { asyncHandler } from '../utils/asyncHandler';
import { COMPANY_ROUTES } from '../constants/routes';
import { authenticateCompany } from '../middleware/auth.middleware';

const router = Router();
const industryCategoryController = container.get<IndustryCategoryController>(TYPES.IndustryCategoryController);

// Admin routes (protected)
router.post(
  COMPANY_ROUTES.INDUSTRIES_BASE,
  authenticateCompany,
  asyncHandler((req, res) => industryCategoryController.createCategory(req, res)),
);

router.get(
  COMPANY_ROUTES.INDUSTRIES_BASE,
  authenticateCompany,
  asyncHandler((req, res) => industryCategoryController.getAllCategories(req, res)),
);

router.put(
  COMPANY_ROUTES.INDUSTRIES_DETAIL,
  authenticateCompany,
  asyncHandler((req, res) => industryCategoryController.updateCategory(req, res)),
);

router.delete(
  COMPANY_ROUTES.INDUSTRIES_DETAIL,
  authenticateCompany,
  asyncHandler((req, res) => industryCategoryController.deleteCategory(req, res)),
);

export default router;

