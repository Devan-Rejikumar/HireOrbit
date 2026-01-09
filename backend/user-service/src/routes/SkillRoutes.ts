import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { SkillController } from '../controllers/SkillController';
import { asyncHandler } from '../utils/asyncHandler';
import { ADMIN_ROUTES, PUBLIC_ROUTES } from '../constants/routes';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const skillController = container.get<SkillController>(TYPES.SkillController);

// Public route for users: get active skills for autocomplete
router.get(
  PUBLIC_ROUTES.SKILLS,
  asyncHandler((req, res) => skillController.getActiveSkills(req, res)),
);

// Admin routes (under /api/admin)
router.post(
  ADMIN_ROUTES.SKILLS_BASE,
  authenticateToken,
  asyncHandler((req, res) => skillController.createSkill(req, res)),
);

router.get(
  ADMIN_ROUTES.SKILLS_BASE,
  authenticateToken,
  asyncHandler((req, res) => skillController.getAllSkills(req, res)),
);

router.put(
  ADMIN_ROUTES.SKILLS_DETAIL,
  authenticateToken,
  asyncHandler((req, res) => skillController.updateSkill(req, res)),
);

router.delete(
  ADMIN_ROUTES.SKILLS_DETAIL,
  authenticateToken,
  asyncHandler((req, res) => skillController.deleteSkill(req, res)),
);

export default router;


