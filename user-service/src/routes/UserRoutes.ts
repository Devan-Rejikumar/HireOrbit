import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { UserController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const userController = container.get<UserController>(TYPES.UserController);


router.post('/register', asyncHandler((req, res) => userController.register(req, res)));
router.post('/login', asyncHandler((req, res) => userController.login(req, res)));
router.post('/refresh-token', asyncHandler((req, res) => userController.refreshToken(req, res)));
router.post('/generate-otp', asyncHandler((req, res) => userController.generateOTP(req, res)));
router.post('/generate-verification-otp', asyncHandler((req, res) => userController.generateVerificationOTP(req, res)));
router.post('/verify-otp', asyncHandler((req, res) => userController.verifyOTP(req, res)));
router.post('/resend-otp', asyncHandler((req, res) => userController.resendOTP(req, res)));
router.get('/me', authenticateToken, asyncHandler((req, res) => userController.getMe(req, res)));
router.get('/:id', asyncHandler((req, res) => userController.getUserById(req, res)));
router.post('/logout', authenticateToken, asyncHandler((req, res) => userController.logout(req, res)));
router.post('/forgot-password', asyncHandler((req, res) => userController.forgotPassword(req, res)));
router.post('/verify-password-reset-otp', asyncHandler((req, res) => userController.verifyPasswordResetOTP(req, res)));
router.post('/reset-password', asyncHandler((req, res) => userController.resetPassword(req, res)));
router.put('/update-name', authenticateToken, asyncHandler((req, res) => userController.updateName(req, res)));
router.post('/google-auth', asyncHandler((req, res) => userController.googleAuth(req, res)));
router.put('/change-password', authenticateToken, asyncHandler((req, res) => userController.changePassword(req, res)));




export default router;

