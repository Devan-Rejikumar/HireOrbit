import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { SettingsController } from '../controllers/SettingsController';
import { authenticateToken } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const settingsController = container.get<SettingsController>(TYPES.SettingsController);

// Get settings (public - no auth needed for reading)
router.get('/', asyncHandler(async (req, res) => {
  await settingsController.getSettings(req, res);
}));

// Update settings (admin only - require authentication)
router.put('/logo', authenticateToken, asyncHandler(async (req, res) => {
  await settingsController.updateLogo(req, res);
}));

router.put('/company-name', authenticateToken, asyncHandler(async (req, res) => {
  await settingsController.updateCompanyName(req, res);
}));

router.put('/about-page', authenticateToken, asyncHandler(async (req, res) => {
  await settingsController.updateAboutPage(req, res);
}));

router.put('/', authenticateToken, asyncHandler(async (req, res) => {
  await settingsController.updateSettings(req, res);
}));

export default router;

