import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import TYPES from '../config/types';
import { ICompanyService } from '../services/ICompanyService';
import { HttpStatusCode, AuthStatusCode, OTPStatusCode, CompanyStatusCode, ValidationStatusCode } from '../enums/StatusCodes';
import { CompanyGenerateOTPSchema, CompanyLoginSchema, CompanyProfileSchema, CompanyRegisterSchema, CompanyStep2Schema, CompanyStep3Schema, CompanyVerifyOTPSchema, RejectCompanySchema } from '../dto/schemas/company.schema';
import { buildErrorResponse, buildSuccessResponse } from 'shared-dto';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

@injectable()
export class CompanyController {
  constructor(@inject(TYPES.ICompanyService) private companyService: ICompanyService) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = CompanyRegisterSchema.safeParse(req.body);
      if(!validationResult.success){
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(buildErrorResponse('Validation failed', validationResult.error.message));
        return;
      }
      const { email, password, companyName } = validationResult.data;
      const company = await this.companyService.register(email, password, companyName);
      res.status(AuthStatusCode.COMPANY_REGISTRATION_SUCCESS).json(buildSuccessResponse(company,'Company Registered successfully'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage === 'Email already in use') {
        res.status(AuthStatusCode.EMAIL_ALREADY_EXISTS).json(buildErrorResponse(errorMessage,'Company registeration failed'));
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(buildErrorResponse(errorMessage,'Company registeration failed'));
      }
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = CompanyLoginSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message),
        );
        return;
      }
      const { email, password } = validationResult.data;
      const result = await this.companyService.login(email, password);
      
      res.cookie('companyAccessToken', result.tokens.accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 2 * 60 * 60 * 1000,
        domain: 'localhost',
        path: '/',
      });
    
      res.cookie('companyRefreshToken', result.tokens.refreshToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        domain: 'localhost',
        path: '/',
      });
      res.status(AuthStatusCode.COMPANY_LOGIN_SUCCESS).json(
        buildSuccessResponse({ company: result.company }, 'Company login successful'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Company login failed'),
      );
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken: string | undefined = req.cookies.companyRefreshToken;
    
      if (!refreshToken) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(buildErrorResponse('No refresh token','Authentication required'));
        return;
      }

      const result = await this.companyService.refreshToken(refreshToken);
    
      res.cookie('companyAccessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 2 * 60 * 60 * 1000,
      });
    
      res.status(HttpStatusCode.OK).json(buildSuccessResponse(null,'Token refreshed successfully'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.UNAUTHORIZED).json(buildErrorResponse(errorMessage,'Token refresh failed'));
    }
  }
  async generateOTP(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = CompanyGenerateOTPSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message),
        );
        return;
      }
      const { email } = validationResult.data;
      const result = await this.companyService.generateOTP(email);
      res.status(OTPStatusCode.OTP_GENERATED).json(
        buildSuccessResponse(result, 'OTP generated successfully'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(ValidationStatusCode.VALIDATION_ERROR).json(
        buildErrorResponse(errorMessage, 'OTP generation failed'),
      );
    }
  }

  async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = CompanyVerifyOTPSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(OTPStatusCode.OTP_REQUIRED).json(
          buildErrorResponse('Validation failed', validationResult.error.message),
        );
        return;
      }
      const { email, otp } = validationResult.data;
      const result = await this.companyService.verifyOTP(email, parseInt(otp));
      res.status(OTPStatusCode.OTP_VERIFIED).json(
        buildSuccessResponse(result, 'OTP verified successfully'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(OTPStatusCode.OTP_INVALID).json(
        buildErrorResponse(errorMessage, 'OTP verification failed'),
      );
    }
  }

  async resendOTP(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = CompanyGenerateOTPSchema.safeParse(req.body);
      if(!validationResult.success){
        res.status(OTPStatusCode.EMAIL_REQUIRED).json(buildErrorResponse('Validation failed', validationResult.error.message));
        return;
      }
      const { email } = validationResult.data;
      const result = await this.companyService.resendOTP(email);
      res.status(OTPStatusCode.OTP_RESENT).json(buildSuccessResponse(result,'OTP resent successfully'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(ValidationStatusCode.VALIDATION_ERROR).json(buildErrorResponse(errorMessage,'OTP resend failed'));
    }
  }
  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId || req.headers['x-user-id'] as string;
      console.log('🔍 [getMe] Company ID from request:', companyId);
      const email = req.user?.email || req.headers['x-user-email'] as string;
      console.log('🔍 [getMe] Email from request:', email);

      if (!companyId) {
        res.status(401).json(buildErrorResponse('Company not authenticated','Authentication required'));
        return;
      }

      console.log('�� [getMe] Fetching company profile for ID:', companyId);
      const company = await this.companyService.getCompanyProfile(companyId);
      console.log('🔍 [getMe] Company found:', !!company);
      
      if (!company) {
        console.log('❌ [getMe] Company not found');
        res.status(404).json(buildErrorResponse('Company not found','Company profile not found'));
        return;
      }

      console.log('✅ [getMe] Returning company data');
      res.status(200).json(buildSuccessResponse({ id: company.id,companyName:company.companyName,email:company.email },'Company profile retrieved successfully'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(buildErrorResponse(errorMessage,'Failed to retrieve company profile'));
    }
  }


  async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.companyRefreshToken;
    
      if (refreshToken) {
        await this.companyService.logoutWithToken(refreshToken);
      }
      res.clearCookie('companyAccessToken', { 
        httpOnly: true, 
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
    
      res.clearCookie('companyRefreshToken', { 
        httpOnly: true, 
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
    
      res.status(HttpStatusCode.OK).json(buildSuccessResponse(null,'Logged out successfully'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(buildErrorResponse(errorMessage,'Logout failed'));
    }
  }

  async getAllCompanies(req: Request, res: Response): Promise<void> {
    try {
      const companies = await this.companyService.getAllCompanies();
      res.status(CompanyStatusCode.COMPANIES_RETRIEVED).json(
        buildSuccessResponse({ companies }, 'Companies retrieved successfully'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to fetch companies'),
      );
    }
  }

  async blockCompany(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Company ID is required', 'Validation failed'),
        );
        return;
      }
      await this.companyService.blockCompany(id);
      res.status(CompanyStatusCode.COMPANY_BLOCKED).json(
        buildSuccessResponse(null, 'Company blocked successfully'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to block company'),
      );
    }
  }

  async unblockCompany(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; 
      if (!id) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Company ID is required', 'Validation failed'),
        );
        return;
      }
      await this.companyService.unblockCompany(id);
      res.status(CompanyStatusCode.COMPANY_UNBLOCKED).json(
        buildSuccessResponse(null, 'Company unblocked successfully'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to unblock company'),
      );
    }
  }

async completeStep2(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    console.log('🔍 [COMPANY-CONTROLLER] Step 2 request body:', req.body);
    console.log('🔍 [COMPANY-CONTROLLER] Step 2 headers:', req.headers);
    console.log('🔍 [COMPANY-CONTROLLER] User from auth:', req.user);
    
    const validationResult = CompanyStep2Schema.safeParse(req.body);
    if (!validationResult.success) {
      console.log('❌ [COMPANY-CONTROLLER] Validation failed:', validationResult.error);
      res.status(ValidationStatusCode.VALIDATION_ERROR).json(
        buildErrorResponse('Validation failed', validationResult.error.message),
      );
      return;
    }
    const companyId = req.user?.companyId;
    const step2Data = validationResult.data;
  
    if (!companyId) {
      console.log('❌ [COMPANY-CONTROLLER] No company ID in user context');
      res.status(401).json(
        buildErrorResponse('Company not authenticated', 'Authentication required'),
      );
      return;
    }

    console.log('✅ [COMPANY-CONTROLLER] Company ID:', companyId);
    console.log('✅ [COMPANY-CONTROLLER] Step 2 data:', step2Data);
  
    console.log('🔄 [COMPANY-CONTROLLER] Calling companyService.completeStep2...');
    const company = await this.companyService.completeStep2(companyId, step2Data);
    console.log('✅ [COMPANY-CONTROLLER] Step 2 completed successfully for company:', company.id);
    res.status(CompanyStatusCode.STEP2_COMPLETED).json(
      buildSuccessResponse({ company }, 'Step 2 completed successfully'),
    );
  } catch (err) {
    console.error('❌ [COMPANY-CONTROLLER] Step 2 completion error:', err);
    console.error('❌ [COMPANY-CONTROLLER] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
      buildErrorResponse(errorMessage, 'Step 2 completion failed'),
    );
  }
}

  async completeStep3(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validationResult = CompanyStep3Schema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message),
        );
        return;
      }
      const companyId = req.user?.companyId;
      const step3Data = validationResult.data;
    
      if (!companyId) {
        res.status(AuthStatusCode.COMPANY_NOT_AUTHENTICATED).json(
          buildErrorResponse('Company not authenticated', 'Authentication required'),
        );
        return;
      }
    
      const company = await this.companyService.completeStep3(companyId, step3Data);

      res.status(CompanyStatusCode.STEP3_COMPLETED).json(
        buildSuccessResponse({ 
          company, 
          message: 'Profile completed! Submitted for admin review.', 
        }, 'Step 3 completed successfully'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(ValidationStatusCode.VALIDATION_ERROR).json(
        buildErrorResponse(errorMessage, 'Step 3 completion failed'),
      );
    }
  }

  async getCompanyProfile(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json(buildErrorResponse('No token provided','Authentication required'));
        return;
      }

      const token = authHeader.substring(7); 
      const jwt = require('jsonwebtoken');
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        res.status(500).json(buildErrorResponse('Server configuration error','Internal server error'));
        return;
      }

      const decoded = jwt.verify(token, jwtSecret);
      if (decoded.role !== 'company') {
        res.status(403).json(buildErrorResponse('Invalid token type','Company token required'));
        return;
      }

      const companyId = decoded.userId || decoded.companyId;

      if (!companyId) {
        res.status(401).json(buildErrorResponse('Company not authenticated','Authentication required'));
        return;
      }

      const company = await this.companyService.getCompanyProfile(companyId);
      const profileStep = await this.companyService.getProfileStep(companyId);
      res.status(CompanyStatusCode.PROFILE_RETRIEVED).json(buildSuccessResponse({ company, profileStep },'Company profile retrieved successfully'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(buildErrorResponse(errorMessage,'Failed to retreive company profile'));
    }
  }

  async getProfileStep(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        res.status(AuthStatusCode.COMPANY_NOT_AUTHENTICATED).json(
          buildErrorResponse('Company not authenticated', 'Authentication required'),
        );
        return;
      }
      const company = await this.companyService.getCompanyProfile(companyId);
    
      if (company?.isVerified) {
        res.status(HttpStatusCode.OK).json(
          buildSuccessResponse({ profileStep: 'approved' }, 'Company is approved'),
        );
        return;
      }
      if (company?.rejectionReason) {
        res.status(HttpStatusCode.OK).json(
          buildSuccessResponse({ profileStep: 'rejected' }, 'Company is rejected'),
        );
        return;
      }
    
      const profileStep = await this.companyService.getProfileStep(companyId);
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ profileStep }, 'Profile step retrieved successfully'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to retrieve profile step'),
      );
    }
  }

  async getPendingCompanies(req: Request, res: Response): Promise<void> {
    try {
      const companies = await this.companyService.getPendingCompanies();
      res.status(CompanyStatusCode.PENDING_COMPANIES_RETRIEVED).json(
        buildSuccessResponse({ companies }, 'Pending companies retrieved successfully'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to retrieve pending companies'),
      );
    }
  }

  async approveCompany(req: Request, res: Response): Promise<void> {
    try {
      const { id: companyId } = req.params;
      const adminId = req.headers['x-user-id'] as string;
      const adminRole = req.headers['x-user-role'] as string;
      if (!adminId || adminRole !== 'admin') {
        res.status(AuthStatusCode.ADMIN_NOT_AUTHENTICATED).json(
          buildErrorResponse('Admin not authenticated', 'Admin access required'),
        );
        return;
      }
      const company = await this.companyService.approveCompany(companyId, adminId);
      res.status(CompanyStatusCode.COMPANY_APPROVED).json(
        buildSuccessResponse({ 
          company, 
          message: 'Company approved successfully', 
        }, 'Company approved successfully'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(ValidationStatusCode.VALIDATION_ERROR).json(
        buildErrorResponse(errorMessage, 'Company approval failed'),
      );
    }
  }
  async rejectCompany(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = RejectCompanySchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.REJECTION_REASON_REQUIRED).json(
          buildErrorResponse('Validation failed', validationResult.error.message),
        );
        return;
      }
      const { id: companyId } = req.params;
      const { reason } = validationResult.data;
      const adminId = req.headers['x-user-id'] as string;
      const adminRole = req.headers['x-user-role'] as string;
    
      if (!adminId || adminRole !== 'admin') {
        res.status(AuthStatusCode.ADMIN_NOT_AUTHENTICATED).json(
          buildErrorResponse('Admin not authenticated', 'Admin access required'),
        );
        return;
      }
    
      const company = await this.companyService.rejectCompany(companyId, reason, adminId);
      res.status(CompanyStatusCode.COMPANY_REJECTED).json(
        buildSuccessResponse({ company }, 'Company rejected successfully'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(ValidationStatusCode.VALIDATION_ERROR).json(
        buildErrorResponse(errorMessage, 'Company rejection failed'),
      );
    }
  }

  async getAllCompaniesForAdmin(req: Request, res: Response): Promise<void> {
    try {
      const companies = await this.companyService.getAllCompaniesForAdmin();
      res.status(CompanyStatusCode.COMPANIES_RETRIEVED).json(
        buildSuccessResponse({ companies }, 'Companies retrieved successfully'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to retrieve companies'),
      );
    }
  }

  async getCompanyDetailsForAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { id: companyId } = req.params;
      const adminId = req.headers['x-user-id'] as string;
      const adminRole = req.headers['x-user-role'] as string;
      if (!adminId || adminRole !== 'admin') {
        res.status(AuthStatusCode.ADMIN_NOT_AUTHENTICATED).json(
          buildErrorResponse('Admin not authenticated', 'Admin access required'),
        );
        return;
      }
      const company = await this.companyService.getCompanyDetailsForAdmin(companyId);
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ company }, 'Company details retrieved successfully'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to retrieve company details'),
      );
    }
  }

  async getCompanyJobCount(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json(buildErrorResponse('No token provided','Authentication required'));
        return;
      }

      const token = authHeader.substring(7);
      const jwt = require('jsonwebtoken');
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        res.status(500).json(buildErrorResponse('Server configuration error','Internal server error'));
        return;
      }

      const decoded = jwt.verify(token, jwtSecret);
      if (decoded.role !== 'company') {
        res.status(403).json(buildErrorResponse('Invalid token type','Company token required'));
        return;
      }

      const companyId = decoded.userId || decoded.companyId;

      if (!companyId) {
        res.status(401).json(buildErrorResponse('Company not authenticated','Authentication required'));
        return;
      }
    
      const jobCount: number = await this.companyService.getCompanyJobCount(companyId);
    
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ count: jobCount }, 'Job count retrieved successfully'),
      );
    } catch (err) {
      const errorMessage: string = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to retrieve job count'),
      );
    }
  }

  async updateCompanyProfile(req:AuthenticatedRequest, res:Response):Promise<void>{
    try {
      const companyId = req.user?.companyId || req.headers['x-user-id'] as string;
      if(!companyId){
        res.status(AuthStatusCode.COMPANY_NOT_AUTHENTICATED).json(buildErrorResponse('Company not authenticated','Authentication required'));
        return;
      }
      
      console.log('Update profile request body:', req.body);
      console.log('Company ID:', companyId);
      
      const validatedData = CompanyProfileSchema.parse(req.body);
      console.log('Validated data:', validatedData);
      
      const updateCompany = await this.companyService.updateCompanyProfile(companyId, validatedData);
      console.log('Updated company:', updateCompany);
      
      res.status(CompanyStatusCode.COMPANY_PROFILE_UPDATED).json(buildSuccessResponse({company:updateCompany},'Company profile updated successfully'));

    } catch (err) {
      console.error('Error updating company profile:', err);
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      }
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(buildErrorResponse(errorMessage,'Failed to update company profile'));
    }
  }

  async reapplyCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      console.log('🔄 reapplyCompany - Company ID:', companyId);
      
      if (!companyId) {
        console.log('❌ No company ID in headers');
        res.status(AuthStatusCode.COMPANY_NOT_AUTHENTICATED).json(
          buildErrorResponse('Company not authenticated', 'Authentication required')
        );
        return;
      }

      const result = await this.companyService.reapplyCompany(companyId);
      console.log('✅ Reapplication successful:', result);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Reapplication initiated successfully')
      );
    } catch (err) {
      console.error('❌ Error in reapplyCompany:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Reapplication failed')
      );
    }
  }

  async getReapplyStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      console.log('🔍 getReapplyStatus - Company ID:', companyId);
      
      if (!companyId) {
        console.log('❌ No company ID in headers');
        res.status(AuthStatusCode.COMPANY_NOT_AUTHENTICATED).json(
          buildErrorResponse('Company not authenticated', 'Authentication required')
        );
        return;
      }

      const status = await this.companyService.getReapplyStatus(companyId);
      console.log('✅ Reapply status retrieved:', status);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(status, 'Reapply status retrieved successfully')
      );
    } catch (err) {
      console.error('❌ Error in getReapplyStatus:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to get reapply status')
      );
    }
  }
    async searchCompanyByName(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.query;
      
      if (!name || typeof name !== 'string') {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse('Company name is required')
        );
        return;
      }

      const company = await this.companyService.searchCompanyByName(name);
      
      if (!company) {
        res.status(HttpStatusCode.NOT_FOUND).json(
          buildErrorResponse('Company not found')
        );
        return;
      }
      const publicProfile = {
        id: company.id,
        name: company.companyName,
        industry: company.industry,
        companySize: company.size,
        website: company.website,
        description: company.description,
        logo: company.logo,
        foundedYear: company.foundedYear?.toString(),
        location: company.headquarters,
        email: company.contactPersonEmail,
        phone: company.phone,
        socialMedia: {
          linkedin: company.linkedinUrl
        }
      };

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ company: publicProfile }, 'Company profile retrieved successfully')
      );
    } catch (err) {
      console.error('Error searching company:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to search company')
      );
    }
  }
}



