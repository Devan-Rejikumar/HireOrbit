import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { UserController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/authMiddleware';


const router = Router();
const userController = container.get<UserController>(TYPES.UserController);

router.post('/register', (req, res) => userController.register(req, res));
router.post('/login', (req, res) => userController.login(req, res));
router.post('/refresh-token',(req,res)=> userController.refreshToken(req,res));
router.post('/generate-otp', (req, res) => userController.generateOTP(req, res));
router.post('/verify-otp', (req, res) => userController.verifyOTP(req, res));
router.post('/resend-otp', (req, res) => userController.resendOTP(req, res));
router.get('/me', authenticateToken, (req, res) => userController.getMe(req, res));
router.post('/logout', authenticateToken, (req, res) => userController.logout(req, res));
router.post('/forgot-password', (req, res) => userController.forgotPassword(req, res));
router.post('/verify-password-reset-otp',(req,res)=>userController.verifyPasswordResetOTP(req,res));
router.post('/reset-password', (req, res) => userController.resetPassword(req, res));
router.put('/update-name', authenticateToken, (req, res) => userController.updateName(req, res));
router.post('/google-auth', (req, res) => userController.googleAuth(req, res));




export default router;

