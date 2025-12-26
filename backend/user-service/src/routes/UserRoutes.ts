import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { UserController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { USER_ROUTES } from '../constants/routes';

const router = Router();
const userController = container.get<UserController>(TYPES.UserController);

router.post(USER_ROUTES.REGISTER, asyncHandler((req, res) => userController.register(req, res)));
router.post(USER_ROUTES.LOGIN, asyncHandler((req, res) => userController.login(req, res)));
router.post(USER_ROUTES.REFRESH_TOKEN, asyncHandler((req, res) => userController.refreshToken(req, res)));
router.post(USER_ROUTES.GENERATE_OTP, asyncHandler((req, res) => userController.generateOTP(req, res)));
router.post(USER_ROUTES.GENERATE_VERIFICATION_OTP, asyncHandler((req, res) => userController.generateVerificationOTP(req, res)));
router.post(USER_ROUTES.VERIFY_OTP, asyncHandler((req, res) => userController.verifyOTP(req, res)));
router.post(USER_ROUTES.RESEND_OTP, asyncHandler((req, res) => userController.resendOTP(req, res)));
router.get(USER_ROUTES.GET_ME, authenticateToken, asyncHandler((req, res) => userController.getMe(req, res)));
router.get(USER_ROUTES.GET_USER_BY_ID, asyncHandler((req, res) => userController.getUserById(req, res)));
router.post(USER_ROUTES.LOGOUT, authenticateToken, asyncHandler((req, res) => userController.logout(req, res)));
router.post(USER_ROUTES.FORGOT_PASSWORD, asyncHandler((req, res) => userController.forgotPassword(req, res)));
router.post(USER_ROUTES.VERIFY_PASSWORD_RESET_OTP, asyncHandler((req, res) => userController.verifyPasswordResetOTP(req, res)));
router.post(USER_ROUTES.RESET_PASSWORD, asyncHandler((req, res) => userController.resetPassword(req, res)));
router.put(USER_ROUTES.UPDATE_NAME, authenticateToken, asyncHandler((req, res) => userController.updateName(req, res)));
router.post(USER_ROUTES.GOOGLE_AUTH, asyncHandler((req, res) => userController.googleAuth(req, res)));
router.put(USER_ROUTES.CHANGE_PASSWORD, authenticateToken, asyncHandler((req, res) => userController.changePassword(req, res)));




export default router;

