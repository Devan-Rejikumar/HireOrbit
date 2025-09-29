import { Router } from 'express';
import container from '../config/inversify.config';
import TYPES from '../config/types';
import { UserController } from '../controllers/UserController';

const router = Router();
console.log('🔐 [USER ROUTES] Router created');
console.log('🔐 [USER ROUTES] About to get UserController from container...');
const userController = container.get<UserController>(TYPES.UserController);
console.log('🔐 [USER ROUTES] UserController retrieved successfully');

router.post('/register', (req, res) => userController.register(req, res));
router.post('/login', (req, res) => {
  console.log('🔐 [USER ROUTES] Login route hit');
  console.log('🔐 [USER ROUTES] Request body:', req.body);
  console.log('🔐 [USER ROUTES] About to call userController.login...');
  userController.login(req, res);
  console.log('🔐 [USER ROUTES] userController.login call completed');
});
router.post('/refresh-token',(req,res)=> userController.refreshToken(req,res));
router.post('/generate-otp', (req, res) => userController.generateOTP(req, res));
router.post('/verify-otp', (req, res) => userController.verifyOTP(req, res));
router.post('/resend-otp', (req, res) => userController.resendOTP(req, res));
router.get('/me', (req, res) => userController.getMe(req, res));
router.post('/logout', (req, res) => userController.logout(req, res));
router.post('/forgot-password', (req, res) => userController.forgotPassword(req, res));
router.post('/verify-password-reset-otp',(req,res)=>userController.verifyPasswordResetOTP(req,res));
router.post('/reset-password', (req, res) => userController.resetPassword(req, res));
router.put('/update-name', (req, res) => userController.updateName(req, res));
router.post('/google-auth', (req, res) => userController.googleAuth(req, res));
router.put('/change-password', (req, res) => userController.changePassword(req, res));




export default router;

