import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { SiteSettingsController } from '../controllers/SiteSettingsController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const siteSettingsController = container.get<SiteSettingsController>(TYPES.SiteSettingsController);

// Public routes
router.get('/public/settings', asyncHandler((req, res) => siteSettingsController.getSettings(req, res)));
router.get('/public/banners', asyncHandler((req, res) => siteSettingsController.getActiveBanners(req, res)));
router.get('/public/content-pages/:slug', asyncHandler((req, res) => siteSettingsController.getContentPage(req, res)));

// Admin routes (protected)
router.get('/admin/settings', authenticateToken, asyncHandler((req, res) => siteSettingsController.getSettings(req, res)));
router.put('/admin/settings/logo', authenticateToken, asyncHandler((req, res) => siteSettingsController.updateLogo(req, res)));
router.get('/admin/banners', authenticateToken, asyncHandler((req, res) => siteSettingsController.getAllBanners(req, res)));
router.get('/admin/banners/:id', authenticateToken, asyncHandler((req, res) => siteSettingsController.getBannerById(req, res)));
router.post('/admin/banners', authenticateToken, asyncHandler((req, res) => siteSettingsController.createBanner(req, res)));
router.put('/admin/banners/:id', authenticateToken, asyncHandler((req, res) => siteSettingsController.updateBanner(req, res)));
router.delete('/admin/banners/:id', authenticateToken, asyncHandler((req, res) => siteSettingsController.deleteBanner(req, res)));
router.put('/admin/banners/reorder', authenticateToken, asyncHandler((req, res) => siteSettingsController.reorderBanners(req, res)));
router.get('/admin/content-pages/:slug', authenticateToken, asyncHandler((req, res) => siteSettingsController.getContentPage(req, res)));
router.put('/admin/content-pages/:slug', authenticateToken, asyncHandler((req, res) => siteSettingsController.updateContentPage(req, res)));

export default router;

