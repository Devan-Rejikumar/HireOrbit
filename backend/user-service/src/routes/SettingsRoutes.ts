import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { SettingsController } from '../controllers/SettingsController';
import { authenticateToken } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { SETTINGS_ROUTES } from '../constants/routes';

const router = Router();
const settingsController = container.get<SettingsController>(TYPES.SettingsController);

// Get settings (public - no auth needed for reading)
router.get(SETTINGS_ROUTES.GET_SETTINGS, asyncHandler(async (req, res) => {
  await settingsController.getSettings(req, res);
}));

// Update settings (admin only - require authentication)
router.put(SETTINGS_ROUTES.UPDATE_LOGO, authenticateToken, asyncHandler(async (req, res) => {
  await settingsController.updateLogo(req, res);
}));

router.put(SETTINGS_ROUTES.UPDATE_COMPANY_NAME, authenticateToken, asyncHandler(async (req, res) => {
  await settingsController.updateCompanyName(req, res);
}));

router.put(SETTINGS_ROUTES.UPDATE_ABOUT_PAGE, authenticateToken, asyncHandler(async (req, res) => {
  await settingsController.updateAboutPage(req, res);
}));

router.put(SETTINGS_ROUTES.UPDATE_SETTINGS, authenticateToken, asyncHandler(async (req, res) => {
  await settingsController.updateSettings(req, res);
}));

export default router;

