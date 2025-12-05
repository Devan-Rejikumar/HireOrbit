import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IUserService } from '../services/interfaces/IUserService';
import { CookieService } from '../services/implementations/CookieService';
import { Messages } from '../constants/Messages';
import { CookieConfig } from '../constants/CookieConfig';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import path from 'path';
import { HttpStatusCode, AuthStatusCode, ValidationStatusCode } from '../enums/StatusCodes';
import { UserRole } from '../enums/UserRole';
import { GOOGLE_AUTH_TOKEN_EXPIRY } from '../constants/TimeConstants';
import { UserRegisterSchema, UserLoginSchema, GenerateOTPSchema, VerifyOTPSchema, RefreshTokenSchema, ResendOTPSchema, ForgotPasswordSchema, ResetPasswordSchema, UpdateNameSchema, GoogleAuthSchema, ChangePasswordSchema } from '../dto/schemas/auth.schema';
import { buildSuccessResponse, buildErrorResponse } from 'shared-dto';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { getUserIdFromRequest } from '../utils/requestHelpers';
import { AppError } from '../utils/errors/AppError';
import { AppConfig } from '../config/app.config';
import { logger } from '../utils/logger';

if (!admin.apps.length) {
  const serviceAccountPath = path.join(
    __dirname,
    '../../firebase-service-account.json'
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: process.env.FIREBASE_PROJECT_ID!,
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
    fileSize: AppConfig.MAX_FILE_SIZE_BYTES,
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
  constructor(
    @inject(TYPES.IUserService) private _userService: IUserService,
    @inject(TYPES.CookieService) private _cookieService: CookieService
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    const validationResult = UserRegisterSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    
    const { email, password, name, role } = validationResult.data;
    const user = await this._userService.register(email, password, name, role);
    res.status(AuthStatusCode.REGISTRATION_SUCCESS).json(
      buildSuccessResponse(user, Messages.AUTH.REGISTRATION_SUCCESS)
    );
  }

  async login(req: Request, res: Response): Promise<void> {  
    logger.debug('USER CONTROLLER About to validate request body...');
    const validationResult = UserLoginSchema.safeParse(req.body);
    if(!validationResult.success){
      logger.warn('USER CONTROLLER Validation failed:', validationResult.error.message);
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    logger.debug('USER CONTROLLER Validation successful');

    const { email, password } = validationResult.data; 
    logger.info('USER CONTROLLER Login attempt for email:', email);
    const result = await this._userService.login(email, password);
    logger.info('USER CONTROLLER Login successful for user:', result.user.email);

    logger.debug('USER CONTROLLER About to set cookies...');
    this._cookieService.setAccessToken(res, result.tokens.accessToken);
    this._cookieService.setRefreshToken(res, result.tokens.refreshToken);
    logger.debug('USER CONTROLLER Cookies set');
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result.user, Messages.AUTH.LOGIN_SUCCESS)
    );
    logger.debug('USER CONTROLLER Response sent successfully');
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new AppError(Messages.AUTH.NO_REFRESH_TOKEN, HttpStatusCode.UNAUTHORIZED);
    }
    
    const result = await this._userService.refreshToken(refreshToken);
    this._cookieService.setAccessToken(res, result.accessToken);

    res.status(HttpStatusCode.OK).json({ 
      message: Messages.AUTH.TOKEN_REFRESH_SUCCESS 
    });
  }

  async generateOTP(req: Request, res: Response): Promise<void> {
    const validationResult = GenerateOTPSchema.safeParse(req.body);
    if(!validationResult.success){
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    const { email } = validationResult.data;

    const result = await this._userService.generateOTP(email);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.OTP.GENERATED_SUCCESS)
    );
  }

  async generateVerificationOTP(req: Request, res: Response): Promise<void> {
    const validationResult = GenerateOTPSchema.safeParse(req.body);
    if(!validationResult.success){
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    const { email } = validationResult.data;
    const result = await this._userService.generateVerificationOTP(email);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.OTP.SENT_SUCCESS)
    );
  }

  async verifyOTP(req: Request, res: Response): Promise<void> {
    const validationResult = VerifyOTPSchema.safeParse(req.body);
    if(!validationResult.success){
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    const { email, otp } = validationResult.data;
    const result = await this._userService.verifyOTP(email, parseInt(otp));
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.OTP.VERIFIED_SUCCESS)
    );
  }

  async resendOTP(req: Request, res: Response): Promise<void> {
    const validationResult = ResendOTPSchema.safeParse(req.body);
    if(!validationResult.success){
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    const { email } = validationResult.data;
    const result = await this._userService.resendOTP(email);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.OTP.RESENT_SUCCESS)
    );
  }

  async getMe(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    logger.debug('USER-CONTROLLER User context:', { userId });

    const user = await this._userService.findById(userId);
    if (!user) {
      throw new AppError(Messages.USER.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    logger.debug('USER-CONTROLLER User found:', user);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({user}, Messages.USER.PROFILE_RETRIEVED_SUCCESS)
    );
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError(Messages.USER.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const user = await this._userService.findById(id);
    
    if (!user) {
      throw new AppError(Messages.USER.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ user}, Messages.USER.RETRIEVED_SUCCESS)
    );
  }

  async logout(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const refreshToken = req.cookies.refreshToken;
  
    if (refreshToken) {
      await this._userService.logoutWithToken(refreshToken);
    }

    this._cookieService.clearAccessToken(res);
    this._cookieService.clearRefreshToken(res);
    res.status(HttpStatusCode.OK).json({ 
      message: Messages.AUTH.LOGOUT_SUCCESS 
    });
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const validationResult = ForgotPasswordSchema.safeParse(req.body);
    if(!validationResult.success){
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    const { email } = validationResult.data;
    await this._userService.forgotPassword(email);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(null, Messages.PASSWORD_RESET.OTP_SENT_SUCCESS)
    );
  }

  async verifyPasswordResetOTP(req: Request, res: Response): Promise<void> {
    const validationResult = VerifyOTPSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    const { email, otp } = validationResult.data;
    await this._userService.verifyPasswordResetOTP(email, otp);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(null, Messages.OTP.VERIFIED_SUCCESS)
    );
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const validationResult = ResetPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    const { email, newPassword } = validationResult.data;
    await this._userService.resetPassword(email, newPassword);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(null, Messages.PASSWORD_RESET.RESET_SUCCESS)
    );
  }

  async updateName(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const validationResult = UpdateNameSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    const { name } = validationResult.data;
  
    logger.info('USER-CONTROLLER Updating name for user:', userId);
    const updatedUser = await this._userService.updateUserName(userId, name);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ user: updatedUser }, Messages.NAME.UPDATE_SUCCESS)
    );
  }

  async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      console.log('[UserController] Google auth request received');
      const validationResult = GoogleAuthSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error('[UserController] Validation failed:', validationResult.error.message);
        throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
      }
      const { idToken, email, name, photoURL } = validationResult.data;
      console.log('[UserController] Validated data:', { email, hasName: !!name, hasPhoto: !!photoURL });

      console.log('[UserController] Verifying Firebase token...');
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('[UserController] Token verified successfully:', { email: decodedToken.email });

      if (decodedToken.email !== email) {
        console.error('[UserController] Email mismatch:', { tokenEmail: decodedToken.email, providedEmail: email });
        throw new AppError(Messages.AUTH.INVALID_TOKEN, HttpStatusCode.BAD_REQUEST);
      }

      console.log('[UserController] Checking if user exists...');
      let user = await this._userService.findByEmail(email);
      let isNewUser = false;

      if (!user) {
        console.log('[UserController] User not found, creating new Google user:', { email, name });
        user = await this._userService.createGoogleUser({
          email,
          fullName: name || email.split('@')[0],
          profilePicture: photoURL,
        });
        isNewUser = true;
        console.log('[UserController] Google user created successfully:', { userId: user.id });
      } else {
        console.log('[UserController] Existing user found:', { userId: user.id, email: user.email });
      }

      console.log('[UserController] Generating JWT token...');
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: UserRole.JOBSEEKER },
        process.env.JWT_SECRET!,
        { expiresIn: GOOGLE_AUTH_TOKEN_EXPIRY }
      );
      console.log('[UserController] Token generated successfully');

      console.log('[UserController] Setting token in cookie...');
      this._cookieService.setToken(res, token, CookieConfig.TOKEN_MAX_AGE);
      console.log('[UserController] Token set in cookie, sending response');

      res.status(isNewUser ? AuthStatusCode.REGISTRATION_SUCCESS : AuthStatusCode.LOGIN_SUCCESS)
        .json(buildSuccessResponse({ user, token, isNewUser }, 
          isNewUser ? Messages.AUTH.GOOGLE_REGISTRATION_SUCCESS : Messages.AUTH.GOOGLE_LOGIN_SUCCESS));
    } catch (error: any) {
      console.error('[UserController] Google auth error:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        response: error.response?.data,
        name: error.name
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      // Check if it's a Firebase Admin error
      if (error.code === 'auth/invalid-argument' || error.code === 'auth/id-token-expired') {
        throw new AppError('Invalid or expired Google token', HttpStatusCode.UNAUTHORIZED);
      }
      
      throw new AppError(
        error.message || Messages.AUTH.GOOGLE_AUTH_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const validationResult = ChangePasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }

    const { currentPassword, newPassword } = validationResult.data;

    await this._userService.changePassword(userId, currentPassword, newPassword);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(null, Messages.PASSWORD_RESET.CHANGE_SUCCESS)
    );
  }
}