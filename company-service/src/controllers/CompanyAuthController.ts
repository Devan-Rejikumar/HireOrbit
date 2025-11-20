import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import TYPES from '../config/types';
import { ICompanyService } from '../services/interface/ICompanyService';
import { HttpStatusCode, AuthStatusCode, OTPStatusCode } from '../enums/StatusCodes';
import { CompanyGenerateOTPSchema, CompanyLoginSchema, CompanyRegisterSchema, CompanyVerifyOTPSchema } from '../dto/schemas/company.schema';
import { buildSuccessResponse } from 'shared-dto';
import { AppError } from '../utils/errors/AppError';
import { CookieService } from '../services/implementation/CookieService';
import { Messages } from '../constants/Messages';

@injectable()
export class CompanyAuthController {
  constructor(
    @inject(TYPES.ICompanyService) private _companyService: ICompanyService,
    @inject(TYPES.CookieService) private _cookieService: CookieService
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    const validationResult = CompanyRegisterSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    
    const { email, password, companyName } = validationResult.data;
    const company = await this._companyService.register(email, password, companyName);
    res.status(AuthStatusCode.COMPANY_REGISTRATION_SUCCESS).json(
      buildSuccessResponse(company, Messages.COMPANY.REGISTRATION_SUCCESS)
    );
  }

  async login(req: Request, res: Response): Promise<void> {
    const validationResult = CompanyLoginSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    
    const { email, password } = validationResult.data;
    const result = await this._companyService.login(email, password);
    
    this._cookieService.setCompanyAccessToken(res, result.tokens.accessToken);
    this._cookieService.setCompanyRefreshToken(res, result.tokens.refreshToken);
    
    res.status(AuthStatusCode.COMPANY_LOGIN_SUCCESS).json(
      buildSuccessResponse({ company: result.company }, Messages.COMPANY.LOGIN_SUCCESS)
    );
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies.companyRefreshToken;
    
    if (!refreshToken) {
      throw new AppError(Messages.AUTH.NO_REFRESH_TOKEN, HttpStatusCode.UNAUTHORIZED);
    }

    const result = await this._companyService.refreshToken(refreshToken);
    this._cookieService.setCompanyAccessToken(res, result.accessToken);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(null, Messages.AUTH.TOKEN_REFRESH_SUCCESS)
    );
  }

  async generateOTP(req: Request, res: Response): Promise<void> {
    const validationResult = CompanyGenerateOTPSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    
    const { email } = validationResult.data;
    const result = await this._companyService.generateOTP(email);
    res.status(OTPStatusCode.OTP_GENERATED).json(
      buildSuccessResponse(result, Messages.OTP.GENERATED_SUCCESS)
    );
  }

  async verifyOTP(req: Request, res: Response): Promise<void> {
    const validationResult = CompanyVerifyOTPSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    
    const { email, otp } = validationResult.data;
    const result = await this._companyService.verifyOTP(email, parseInt(otp));
    res.status(OTPStatusCode.OTP_VERIFIED).json(
      buildSuccessResponse(result, Messages.OTP.VERIFIED_SUCCESS)
    );
  }

  async resendOTP(req: Request, res: Response): Promise<void> {
    const validationResult = CompanyGenerateOTPSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(validationResult.error.message, HttpStatusCode.BAD_REQUEST);
    }
    
    const { email } = validationResult.data;
    const result = await this._companyService.resendOTP(email);
    res.status(OTPStatusCode.OTP_RESENT).json(
      buildSuccessResponse(result, Messages.OTP.RESENT_SUCCESS)
    );
  }

  async logout(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies.companyRefreshToken;
  
    if (refreshToken) {
      await this._companyService.logoutWithToken(refreshToken);
    }
    
    this._cookieService.clearCompanyAccessToken(res);
    this._cookieService.clearCompanyRefreshToken(res);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(null, Messages.AUTH.LOGOUT_SUCCESS)
    );
  }
}

