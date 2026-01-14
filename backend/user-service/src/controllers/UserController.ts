import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IUserService } from '../services/interfaces/IUserService';
import { IProfileService } from '../services/interfaces/IProfileService';
import { CookieService } from '../services/implementations/CookieService';
import { Messages } from '../constants/Messages';
import { HttpStatusCode, AuthStatusCode } from '../enums/StatusCodes';
import { UserRegisterSchema, UserLoginSchema, GenerateOTPSchema, VerifyOTPSchema, ResendOTPSchema, ForgotPasswordSchema, ResetPasswordSchema, UpdateNameSchema, GoogleAuthSchema, ChangePasswordSchema } from '../dto/schemas/auth.schema';
import { buildSuccessResponse } from 'hireorbit-shared-dto';
import { v2 as cloudinary } from 'cloudinary';
import { getUserIdFromRequest } from '../utils/requestHelpers';
import { AppError } from '../utils/errors/AppError';
import { logger } from '../utils/logger';
import admin from '../config/firebase';



cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

@injectable()
export class UserController {
  constructor(
    @inject(TYPES.IUserService) private _userService: IUserService,
    @inject(TYPES.CookieService) private _cookieService: CookieService,
    @inject(TYPES.IProfileService) private _profileService: IProfileService
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
    logger.info('[REFRESH-TOKEN] Incoming request');
    logger.info('[REFRESH-TOKEN] All cookies:', JSON.stringify(req.cookies));
    logger.info('[REFRESH-TOKEN] Cookie header:', req.headers.cookie);
    
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      logger.error('[REFRESH-TOKEN] No refreshToken cookie found!');
      throw new AppError(Messages.AUTH.NO_REFRESH_TOKEN, HttpStatusCode.UNAUTHORIZED);
    }
    
    logger.info('[REFRESH-TOKEN] Found refreshToken, attempting refresh...');
    const result = await this._userService.refreshToken(refreshToken);
    this._cookieService.setAccessToken(res, result.accessToken);
    logger.info('[REFRESH-TOKEN] Token refreshed successfully');

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


    let profileData = null;
    try {
      const profile = await this._profileService.getProfile(id);
      if (profile) {
        // Normalize profile picture URL - ensure it's a clean public URL
        let profilePicture = profile.profilePicture;
        if (profilePicture) {
          // Remove signed URL parameters and ensure clean public URL
          if (profilePicture.includes('/image/authenticated/')) {
            // Extract public_id from signed URL
            const match = profilePicture.match(/\/image\/authenticated\/s--[^-]+--\/(.+)$/);
            if (match && match[1]) {
              const publicId = match[1].split('?')[0].split('_a=')[0];
              profilePicture = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
            } else {
              profilePicture = null; // Invalid URL, set to null
            }
          } else if (profilePicture.includes('/image/upload/')) {
            // Clean public URL - remove query params
            try {
              const urlObj = new URL(profilePicture);
              profilePicture = `${urlObj.origin}${urlObj.pathname}`;
            } catch {
              profilePicture = profilePicture.split('?')[0];
            }
          }
        }
        
        profileData = {
          profilePicture: profilePicture || null,
          headline: profile.headline,
          location: profile.location,
        };
    
      } else {
        console.log(` [UserController] No profile found for user ${id}`);
      }
    } catch (error) {

      console.log(`ℹ[UserController] Profile fetch failed for user ${id}:`, error instanceof Error ? error.message : 'Unknown error');
    }

    const responseData: { user: typeof user; profile?: typeof profileData } = { user };
    if (profileData) {
      responseData.profile = profileData;
    }



    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(responseData, Messages.USER.RETRIEVED_SUCCESS)
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
      const validationResult = GoogleAuthSchema.safeParse(req.body);
      if (!validationResult.success) {

        throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
      }
      const { idToken, email, name, photoURL } = validationResult.data;
      const decodedToken = await admin.auth().verifyIdToken(idToken);


      if (decodedToken.email !== email) {
        throw new AppError(Messages.AUTH.INVALID_TOKEN, HttpStatusCode.BAD_REQUEST);
      }

      const result = await this._userService.googleAuth(email,name, photoURL);
      const isNewUser = !result.user.isVerified;

      this._cookieService.setAccessToken(res, result.tokens.accessToken);
      this._cookieService.setRefreshToken(res,result.tokens.refreshToken);

      res.status(isNewUser ? AuthStatusCode.REGISTRATION_SUCCESS : AuthStatusCode.LOGIN_SUCCESS)
        .json(buildSuccessResponse(result.user, 
          isNewUser ? Messages.AUTH.GOOGLE_REGISTRATION_SUCCESS : Messages.AUTH.GOOGLE_LOGIN_SUCCESS));


    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string; code?: string; name?: string; response?: { data?: unknown } };
      console.error('[UserController] Google auth error:', {
        message: err.message,
        stack: err.stack,
        code: err.code,
        response: err.response?.data,
        name: err.name
      });
      
      if (error instanceof AppError) {
        throw error;
      }
 
      if (err.code === 'auth/invalid-argument' || err.code === 'auth/id-token-expired') {
        throw new AppError('Invalid or expired Google token', HttpStatusCode.UNAUTHORIZED);
      }
      
      throw new AppError(
        err.message || Messages.AUTH.GOOGLE_AUTH_FAILED,
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