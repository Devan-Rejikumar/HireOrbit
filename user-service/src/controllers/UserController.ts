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
import { UserRegisterSchema, UserLoginSchema, GenerateOTPSchema, VerifyOTPSchema, RefreshTokenSchema, ResendOTPSchema, ForgotPasswordSchema, ResetPasswordSchema, UpdateNameSchema, GoogleAuthSchema, ChangePasswordSchema } from '../dto/schemas/auth.schema';
import { buildSuccessResponse, buildErrorResponse } from 'shared-dto';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { getUserIdFromRequest } from '../utils/requestHelpers';
import { AppError } from '../utils/errors/AppError';

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
    console.log('USER CONTROLLER About to validate request body...');
    const validationResult = UserLoginSchema.safeParse(req.body);
    if(!validationResult.success){
      console.log('USER CONTROLLER Validation failed:', validationResult.error.message);
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    console.log('USER CONTROLLER Validation successful');

    const { email, password } = validationResult.data; 
    console.log('USER CONTROLLER Login attempt for email:', email);
    const result = await this._userService.login(email, password);
    console.log('USER CONTROLLER Login successful for user:', result.user.email);

    console.log('USER CONTROLLER About to set cookies...');
    this._cookieService.setAccessToken(res, result.tokens.accessToken);
    this._cookieService.setRefreshToken(res, result.tokens.refreshToken);
    console.log('USER CONTROLLER Cookies set');
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result.user, Messages.AUTH.LOGIN_SUCCESS)
    );
    console.log('USER CONTROLLER Response sent successfully');
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

    console.log('USER-CONTROLLER User context:', { userId });

    const user = await this._userService.findById(userId);
    if (!user) {
      throw new AppError(Messages.USER.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    console.log('USER-CONTROLLER User found:', user);
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
  
    console.log('USER-CONTROLLER Updating name for user:', userId);
    const updatedUser = await this._userService.updateUserName(userId, name);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ user: updatedUser }, Messages.NAME.UPDATE_SUCCESS)
    );
  }

  async googleAuth(req: Request, res: Response): Promise<void> {
    const validationResult = GoogleAuthSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    const { idToken, email, name, photoURL } = validationResult.data;
  
    const decodedToken = await admin.auth().verifyIdToken(idToken);
  
    if (decodedToken.email !== email) {
      throw new AppError(Messages.AUTH.INVALID_TOKEN, HttpStatusCode.BAD_REQUEST);
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
  
    this._cookieService.setToken(res, token, CookieConfig.TOKEN_MAX_AGE);
    res.status(isNewUser ? AuthStatusCode.REGISTRATION_SUCCESS : AuthStatusCode.LOGIN_SUCCESS)
      .json(buildSuccessResponse({ user, token, isNewUser }, 
        isNewUser ? Messages.AUTH.GOOGLE_REGISTRATION_SUCCESS : Messages.AUTH.GOOGLE_LOGIN_SUCCESS));
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