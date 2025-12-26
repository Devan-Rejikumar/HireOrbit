import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { AdminController } from '../controllers/AdminController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateToken } from '../middleware/auth.middleware';
import { ADMIN_ROUTES } from '../constants/routes';

const router = Router();
const adminController = container.get<AdminController>(TYPES.AdminController);

router.use((req, res, next) => {
  console.log('[AdminRoutes] Route accessed:', req.method, req.path, 'Body:', req.body);
  next();
});

router.post(ADMIN_ROUTES.LOGIN, asyncHandler((req, res) => adminController.login(req, res)));
router.post(ADMIN_ROUTES.REFRESH_TOKEN, asyncHandler((req, res) => adminController.refreshToken(req, res)));
router.get(ADMIN_ROUTES.GET_ALL_USERS, authenticateToken, asyncHandler((req, res) => adminController.getAllUsers(req, res)));
router.patch(ADMIN_ROUTES.BLOCK_USER, authenticateToken, asyncHandler((req, res) => adminController.blockUser(req, res)));
router.patch(ADMIN_ROUTES.UNBLOCK_USER, authenticateToken, asyncHandler((req, res) => adminController.unblockUser(req, res)));
router.post(ADMIN_ROUTES.LOGOUT, authenticateToken, asyncHandler((req, res) => adminController.logout(req, res)));
router.get(ADMIN_ROUTES.GET_ME, authenticateToken, asyncHandler((req, res) => adminController.me(req, res)));
router.get(ADMIN_ROUTES.GET_DASHBOARD_STATISTICS, authenticateToken, asyncHandler((req, res) => adminController.getDashboardStatistics(req, res)));

export default router;