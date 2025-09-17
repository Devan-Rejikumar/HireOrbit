import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IUserService } from '../services/IUserService';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import path from 'path';
import { HttpStatusCode,AuthStatusCode, ValidationStatusCode } from '../enums/StatusCodes';
import { UserRegisterSchema, UserLoginSchema, GenerateOTPSchema, VerifyOTPSchema, RefreshTokenSchema, ResendOTPSchema, ForgotPasswordSchema, ResetPasswordSchema, UpdateNameSchema, GoogleAuthSchema } from '../dto/schemas/auth.schema';
import { buildSuccessResponse, buildErrorResponse} from 'shared-dto';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

if (!admin.apps.length) {
  const serviceAccountPath = path.join(
    __dirname,
    '../../firebase-service-account.json'
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'hireorbit-d4744',
  });
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});



@injectable()
export class UserController {
  constructor(@inject(TYPES.IUserService) private userService: IUserService) {}
  async register(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = UserRegisterSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
      const { email, password, name, role } = validationResult.data;
      const user = await this.userService.register(email, password, name, role);
      res.status(AuthStatusCode.REGISTRATION_SUCCESS).json(
        buildSuccessResponse(user, 'User registered successfully')
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage === 'Email already in use') {
        res.status(AuthStatusCode.EMAIL_ALREADY_EXISTS).json(
          buildErrorResponse(errorMessage, 'Registration failed')
        );
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
          buildErrorResponse(errorMessage, 'Internal server error')
        );
      }
    }
  }
  async login(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = UserLoginSchema.safeParse(req.body);
      if(!validationResult.success){
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(buildErrorResponse('Validation failed', validationResult.error.message));
        return;
      }

      const { email, password } = validationResult.data; 
      console.log('Login attempt for email:', email);
      const result = await this.userService.login(email, password);
      console.log('Login successful for user:');

      res.cookie('accessToken', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 2*60*60*1000
       
      });
     res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', 
      path: '/',        
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });
      res.status(HttpStatusCode.OK).json(buildSuccessResponse(result.user,'Login successful'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(buildErrorResponse(errorMessage,'Login failed'));
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
  try {   
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({ error: 'No refresh token provided' });
      return;
    }
    const result = await this.userService.refreshToken(refreshToken);
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 1000 
    });

    res.status(HttpStatusCode.OK).json({ message: 'Token refreshed successfully' });
  } catch (error: unknown) {
    res.status(HttpStatusCode.FORBIDDEN).json({ error: 'Invalid refresh token' });
  }
}

  async generateOTP(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = GenerateOTPSchema.safeParse(req.body);
      if(!validationResult.success){
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(buildErrorResponse('Validation failed', validationResult.error.message));
        return;
      }
      const { email } = validationResult.data;

      const result = await this.userService.generateOTP(email);
      res.status(HttpStatusCode.OK).json(buildSuccessResponse(result,'OTP generated successfully'));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'unknown error';
      if(errorMessage==='Email alredy registered'){
        res.status(AuthStatusCode.EMAIL_ALREADY_EXISTS).json(buildErrorResponse(errorMessage,'OTP generation failed'));
      }else{
        res.status(HttpStatusCode.BAD_REQUEST).json(buildErrorResponse(errorMessage,'OTP generation failed'));
      }
    }
  }

  async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = VerifyOTPSchema.safeParse(req.body);
      if(!validationResult.success){
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(buildErrorResponse('Validation failed',validationResult.error.message));
        return;
      }
      const { email, otp } = validationResult.data;
      const result = await this.userService.verifyOTP(email, parseInt(otp));
      res.status(HttpStatusCode.OK).json(buildSuccessResponse(result,'OTP verified successfully'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if(errorMessage === 'OTP has expired'){
        res.status(AuthStatusCode.OTP_EXPIRED).json(buildErrorResponse(errorMessage,'OTP verification failed'));
      }else if (errorMessage=== 'Invalid OTP'){
        res.status(HttpStatusCode.BAD_REQUEST).json(buildErrorResponse(errorMessage,'OTP verification failed'));
      } else{
        res.status(HttpStatusCode.BAD_REQUEST).json(buildErrorResponse(errorMessage,'OTP verification failed'));
      }
    }
  }

  async resendOTP(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = ResendOTPSchema.safeParse(req.body);
      if(!validationResult.success){
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(buildErrorResponse('Validation failed', validationResult.error.message));
        return;
      }
      const { email } = validationResult.data;
      const result = await this.userService.resendOTP(email);
      res.status(HttpStatusCode.OK).json(buildSuccessResponse(result,'OTP resent successfully'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(buildErrorResponse(errorMessage,'OTP resend failed'));
    }
  }


  async getMe(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [USER-CONTROLLER] getMe called');
      console.log('🔍 [USER-CONTROLLER] req.user:', req.user);
      console.log('🔍 [USER-CONTROLLER] Headers (fallback):', {
        'x-user-id': req.headers['x-user-id'],
        'x-user-email': req.headers['x-user-email'],
        'x-user-role': req.headers['x-user-role']
      });

      // Use req.user (preferred method) or fallback to headers
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userEmail = req.user?.email || req.headers['x-user-email'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId) {
        console.log('❌ [USER-CONTROLLER] No user ID found');
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      console.log('✅ [USER-CONTROLLER] User context:', { userId, userEmail, userRole });

      const user = await this.userService.findById(userId);
      if (!user) {
        console.log('❌ [USER-CONTROLLER] User not found in database');
        res.status(404).json({ error: 'User not found' });
        return;
      }

      console.log('✅ [USER-CONTROLLER] User found:', user);
      res.status(200).json(user);
    } catch (error) {
      console.error('❌ [USER-CONTROLLER] Error in getMe:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }


  async logout(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [USER-CONTROLLER] logout called');
      console.log('🔍 [USER-CONTROLLER] req.user:', req.user);
      
      // Use req.user (preferred method) or fallback to headers
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      
      if (!userId) {
        console.log('❌ [USER-CONTROLLER] No user ID found for logout');
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const refreshToken = req.cookies.refreshToken;
    
      if (refreshToken) {
        await this.userService.logoutWithToken(refreshToken);
      }

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = ForgotPasswordSchema.safeParse(req.body);
      if(!validationResult.success){
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(buildErrorResponse('Validation failed', validationResult.error.message));
        return;
      }
      const { email } = validationResult.data;
      await this.userService.forgotPassword(email);
      res.status(HttpStatusCode.OK).json(buildSuccessResponse(null,'Password reset OTP sent successfully'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage === 'User not found') {
        res.status(HttpStatusCode.NOT_FOUND).json(buildErrorResponse(errorMessage,'Password reset failed'));
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json(buildErrorResponse(errorMessage,'Password reset failed'));
      }
    }
  }

  async verifyPasswordResetOTP(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = VerifyOTPSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
      const { email, otp } = validationResult.data;
      await this.userService.verifyPasswordResetOTP(email, otp);
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(null, 'OTP verified successfully')
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
      if (errorMessage === 'Invalid or expired OTP') {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse(errorMessage, 'OTP verification failed')
        );
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse(errorMessage, 'OTP verification failed')
        );
      }
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = ResetPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
      const { email, newPassword } = validationResult.data;
      await this.userService.resetPassword(email, newPassword);
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(null, 'Password reset successful')
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Password reset failed')
      );
    }
  }

  async updateName(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [USER-CONTROLLER] updateName called');
      console.log('🔍 [USER-CONTROLLER] req.user:', req.user);
      
      const validationResult = UpdateNameSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
      
      // Use req.user (preferred method) or fallback to headers
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const { name } = validationResult.data;
    
      if (!userId) {
        console.log('❌ [USER-CONTROLLER] No user ID found for updateName');
        res.status(401).json(
          buildErrorResponse('User not authenticated', 'Authentication required')
        );
        return;
      }
    
      console.log('✅ [USER-CONTROLLER] Updating name for user:', userId);
      const updatedUser = await this.userService.updateUserName(userId, name);
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ user: updatedUser }, 'Name updated successfully')
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ [USER-CONTROLLER] Error in updateName:', err);
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Name update failed')
      );
    }
  }

  async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = GoogleAuthSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
      const { idToken, email, name, photoURL } = validationResult.data;
    
      const decodedToken = await admin.auth().verifyIdToken(idToken);
    
      if (decodedToken.email !== email) {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse('Invalid token', 'Authentication failed')
        );
        return;
      }
    
      let user = await this.userService.findByEmail(email);
      let isNewUser = false;
    
      if (!user) {
        user = await this.userService.createGoogleUser({
          email,
          fullName: name || email.split('@')[0],
          profilePicture: photoURL,
        });
        isNewUser = true;
      }
    
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: 'jobseeker' },
        process.env.JWT_SECRET || 'supersecret',
        { expiresIn: '24h' }
      );
    
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.status(isNewUser ? AuthStatusCode.REGISTRATION_SUCCESS : AuthStatusCode.LOGIN_SUCCESS)
        .json(buildSuccessResponse({ user, token, isNewUser }, 
          isNewUser ? 'Google user registered successfully' : 'Google login successful'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Google auth error:', errorMessage);
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Google authentication failed')
      );
    }
  }


}

