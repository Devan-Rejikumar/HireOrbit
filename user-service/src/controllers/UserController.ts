import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IUserService } from '../services/interfaces/IUserService';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import path from 'path';
import { HttpStatusCode,AuthStatusCode, ValidationStatusCode } from '../enums/StatusCodes';
import { UserRegisterSchema, UserLoginSchema, GenerateOTPSchema, VerifyOTPSchema, RefreshTokenSchema, ResendOTPSchema, ForgotPasswordSchema, ResetPasswordSchema, UpdateNameSchema, GoogleAuthSchema, ChangePasswordSchema } from '../dto/schemas/auth.schema';
import { buildSuccessResponse, buildErrorResponse} from 'shared-dto';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        isActive?: boolean;
        createdAt?: string;
        updatedAt?: string;
      };
    }
  }
}


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
  constructor(@inject(TYPES.IUserService) private _userService: IUserService) {}
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
      const user = await this._userService.register(email, password, name, role);
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
      console.log('USER CONTROLLER About to validate request body...');
      const validationResult = UserLoginSchema.safeParse(req.body);
      if(!validationResult.success){
        console.log('USER CONTROLLER Validation failed:', validationResult.error.message);
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(buildErrorResponse('Validation failed', validationResult.error.message));
        return;
      }
      console.log('USER CONTROLLER Validation successful');

      const { email, password } = validationResult.data; 
      console.log('USER CONTROLLER Login attempt for email:', email);
      const result = await this._userService.login(email, password);
      console.log('USER CONTROLLERLogin successful for user:', result.user.email);

      console.log('USER CONTROLLER About to set cookies...');
      res.cookie('accessToken', result.tokens.accessToken, {
        httpOnly: false,  
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: 'localhost',
        path: '/',
        maxAge: 2*60*60*1000
      });
      console.log('USER CONTROLLER accessToken cookie set');
      
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', 
        domain: 'localhost',
        path: '/',        
        maxAge: 7 * 24 * 60 * 60 * 1000 
      });
      console.log('USER CONTROLLER refreshToken cookie set');
      res.status(HttpStatusCode.OK).json(buildSuccessResponse(result.user,'Login successful'));
      console.log('USER CONTROLLER Response sent successfully');
    } catch (err) {
      console.log('USER CONTROLLER Error in login:', err);
      const errorMessage = err instanceof Error ? err.message : 'unknown error';
      console.log('USER CONTROLLER Sending error response:', errorMessage);
      res.status(HttpStatusCode.BAD_REQUEST).json(buildErrorResponse(errorMessage,'Login failed'));
    }
    console.log('USER CONTROLLER Login method completed');
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
  try {   
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({ error: 'No refresh token provided' });
      return;
    }
    const result = await this._userService.refreshToken(refreshToken);
    res.cookie('accessToken', result.accessToken, {
      httpOnly: false,
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

      const result = await this._userService.generateOTP(email);
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


  async generateVerificationOTP(req: Request, res: Response): Promise<void> {
  try {
    const validationResult = GenerateOTPSchema.safeParse(req.body);
    if(!validationResult.success){
      res.status(ValidationStatusCode.VALIDATION_ERROR).json(buildErrorResponse('Validation failed',validationResult.error.message));
      return;
    }
    const { email } = validationResult.data;
    const result = await this._userService.generateVerificationOTP(email);
    res.status(HttpStatusCode.OK).json(buildSuccessResponse(result,'OTP sent successfully'));
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
      const result = await this._userService.verifyOTP(email, parseInt(otp));
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
      const result = await this._userService.resendOTP(email);
      res.status(HttpStatusCode.OK).json(buildSuccessResponse(result,'OTP resent successfully'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(buildErrorResponse(errorMessage,'OTP resend failed'));
    }
  }


  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userEmail = req.user?.email || req.headers['x-user-email'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId) {
        console.log('USER-CONTROLLER No user ID found');
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      console.log('USER-CONTROLLER User context:', { userId, userEmail, userRole });

      const user = await this._userService.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      console.log('USER-CONTROLLER User found:', user);
      res.status(HttpStatusCode.OK).json(buildSuccessResponse({user},'User profile retrived succcessfully'));
    } catch (error) {
      console.error('USER-CONTROLLER Error in getMe:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(buildErrorResponse(errorMessage,'Internal server error'));
    }
  }
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse('User ID is required', 'Invalid request')
        );
        return;
      }

      const user = await this._userService.findById(id);
      
      if (!user) {
        res.status(HttpStatusCode.NOT_FOUND).json(
          buildErrorResponse('User not found', 'User does not exist')
        );
        return;
      }

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ user}, 'User retrieved successfully')
      );
    } catch (error) {
      console.error('Error in getUserById:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Internal server error', 'Failed to retrieve user')
      );
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      
      if (!userId) {
        console.log('USER-CONTROLLER No user ID found for logout');
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const refreshToken = req.cookies.refreshToken;
    
      if (refreshToken) {
        await this._userService.logoutWithToken(refreshToken);
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
      await this._userService.forgotPassword(email);
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
      await this._userService.verifyPasswordResetOTP(email, otp);
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
      await this._userService.resetPassword(email, newPassword);
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
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const { name } = validationResult.data;
    
      if (!userId) {
        console.log('USER-CONTROLLER No user ID found for updateName');
        res.status(401).json(
          buildErrorResponse('User not authenticated', 'Authentication required')
        );
        return;
      }
    
      console.log('USER-CONTROLLER Updating name for user:', userId);
      const updatedUser = await this._userService.updateUserName(userId, name);
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ user: updatedUser }, 'Name updated successfully')
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('USER-CONTROLLER Error in updateName:', err);
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
    
      let user = await this._userService.findByEmail(email);
      let isNewUser = false;
    
      if (!user) {
        user = await this._userService.createGoogleUser({
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

async changePassword(req: Request, res: Response): Promise<void> {
  try {
    const validationResult = ChangePasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(ValidationStatusCode.VALIDATION_ERROR).json(
        buildErrorResponse('Validation failed', validationResult.error.message)
      );
      return;
    }

    const { currentPassword, newPassword } = validationResult.data;
    const userId = req.user!.userId; 

    await this._userService.changePassword(userId, currentPassword, newPassword);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(null, 'Password changed successfully. Please login again.')
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    if (errorMessage === 'User not found') {
      res.status(HttpStatusCode.NOT_FOUND).json(
        buildErrorResponse(errorMessage, 'Password change failed')
      );
    } else if (errorMessage === 'Current password is incorrect') {
      res.status(HttpStatusCode.UNAUTHORIZED).json(
        buildErrorResponse(errorMessage, 'Password change failed')
      );
    } else {
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Password change failed')
      );
    }
  }
}

}

