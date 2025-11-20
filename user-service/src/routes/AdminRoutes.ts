import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { AdminController } from '../controllers/AdminController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateToken } from '../middleware/auth';



const router = Router();
const adminController = container.get<AdminController>(TYPES.AdminController);

router.use((req, res, next) => {
  console.log('[AdminRoutes] Route accessed:', req.method, req.path, 'Body:', req.body);
  next();
});
router.post('/login', asyncHandler((req, res) => adminController.login(req, res)));
router.post('/refresh-token', asyncHandler((req, res) => adminController.refreshToken(req, res)));
router.get('/users', authenticateToken, asyncHandler((req, res) => adminController.getAllUsers(req, res)));
router.patch('/users/:id/block', authenticateToken, asyncHandler((req, res) => adminController.blockUser(req, res)));
router.patch('/users/:id/unblock', authenticateToken, asyncHandler((req, res) => adminController.unblockUser(req, res)));
router.post('/logout', authenticateToken, asyncHandler((req, res) => adminController.logout(req, res)));
router.get('/me', authenticateToken, asyncHandler((req, res) => adminController.me(req, res)));
export default router;