import { injectable, inject } from 'inversify';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import TYPES from '../../config/types';
import { ICompanyRepository } from '../../repositories/interfaces/ICompanyRepository';
import { ICompanyService } from '../interfaces/ICompanyService';
import { IEmailService } from '../interfaces/IEmailService';
import { CompanyProfileData, CompanyRegistrationStep2, CompanyRegistrationStep3, CompanyProfileStep, CompanyProfileStepData } from '../../types/company';
import { RedisService } from './RedisService';
import { PaginationResult } from '../../repositories/interfaces/IBaseRepository';
import { CompanyAuthResponse, CompanyResponse } from '../../dto/responses/company.response';
import { mapCompaniesToResponse, mapCompanyToAuthResponse, mapCompanyToResponse } from '../../dto/mappers/company.mapper';
import { AppConfig } from '../../config/app.config';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY, OTP_MIN_VALUE, OTP_MAX_VALUE, OTP_EXPIRY_SECONDS } from '../../constants/TimeConstants';

interface CompanyTokenPayload extends JwtPayload {
  userId: string;
  companyId: string;
  email: string;
  role: string;
  userType: string;
}

@injectable()
export class CompanyService implements ICompanyService {
  constructor(
    @inject(TYPES.ICompanyRepository)
    private _companyRepository: ICompanyRepository,
    @inject(TYPES.EmailService) private _emailService: IEmailService,
    @inject(TYPES.RedisService) private _redisService: RedisService,
  ) { }

  async register(email: string, password: string, companyName: string): Promise<CompanyResponse> {
    const existingCompany = await this._companyRepository.findByEmail(email);
    if (existingCompany) throw new Error('Company already exists');
    const company = await this._companyRepository.create({
      email,
      password: password,
      companyName,
    });
    return mapCompanyToResponse(company);
  }
  /**
   * this method is used for company login purpose
   * @param email 
   * @param password 
   * @returns 
   */
  async login(email: string, password: string): Promise<CompanyAuthResponse> {
    
    const company = await this._companyRepository.findByEmail(email);
    if (!company) throw new Error('Invalid credentials');
    const tokenPayload: Omit<CompanyTokenPayload, 'iat' | 'exp'> = {
      userId: company.id,
      companyId: company.id,
      email: company.email,
      role: 'company',
      userType: 'company'
    };
    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign(tokenPayload, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: REFRESH_TOKEN_EXPIRY });
    return mapCompanyToAuthResponse(company, { accessToken, refreshToken })
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as CompanyTokenPayload;

      const tokenPayload: Omit<CompanyTokenPayload, 'iat' | 'exp'> = {
        userId: decoded.companyId,
        companyId: decoded.companyId,
        email: decoded.email,
        role: 'company',
        userType: 'company',
      };

      const newAccessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY });
      return { accessToken: newAccessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async generateOTP(email: string): Promise<{ message: string; }> {
    try {
      const existingCompany = await this._companyRepository.findByEmail(email);
      if (existingCompany) {
        throw new Error('Company already existing');
      }
      const otp = Math.floor(OTP_MIN_VALUE + Math.random() * (OTP_MAX_VALUE - OTP_MIN_VALUE));
      await this._redisService.storeOTP(email, otp.toString(), OTP_EXPIRY_SECONDS);
      await this._emailService.sendOTP(email, otp);
      return { message: 'OTP send succesfully' };
    } catch (error) {
      console.error('Company service generatedOTP error', error);
      throw error;
    }
  }

  async verifyOTP(email: string, otp: number): Promise<{ message: string; }> {
    const storedOtp = await this._redisService.getOTP(email);
    if (!storedOtp) {
      throw new Error('No OTP found for this email or OTP has expired');
    }
    if (parseInt(storedOtp) !== otp) {
      throw new Error('Invalid credentials');
    }
    await this._redisService.deleteOTP(email);
    return { message: 'OTP deleted succesfully' };
  }

  async resendOTP(email: string): Promise<{ message: string }> {
    const existingCompany = await this._companyRepository.findByEmail(email);
    if (existingCompany) throw new Error('Email already registered');
    await this._redisService.deleteOTP(email);
    return this.generateOTP(email);
  }

  async getAllCompanies(): Promise<CompanyResponse[]> {
    const companies = await this._companyRepository.findAll();
    return mapCompaniesToResponse(companies);
  }


  async getAllCompaniesWithPagination(page: number = 1, limit: number = 10): Promise<PaginationResult<CompanyResponse>> {
    const result = await this._companyRepository.getAllCompaniesWithPagination(page, limit);
    return {
      ...result,
      data: mapCompaniesToResponse(result.data)
    };
  }


  async blockCompany(id: string): Promise<void> {
    await this._companyRepository.blockCompany(id);
  }
  async unblockCompany(id: string): Promise<void> {
    await this._companyRepository.unblockCompany(id);
  }

  async completeProfile(companyId: string, profileData: CompanyProfileData): Promise<CompanyResponse> {
    const company = await this._companyRepository.updateCompanyProfile(companyId, { ...profileData, profileCompleted: true });
    return mapCompanyToResponse(company);
  }

  async completeStep2(companyId: string, step2Data: CompanyRegistrationStep2,): Promise<CompanyResponse> {
    try {
      console.log('COMPANY-SERVICE Checking if company exists...');
      const existingCompany = await this._companyRepository.getCompanyProfile(companyId);
      if (!existingCompany) {
        console.log('COMPANY-SERVICE Company not found with ID:', companyId);
        throw new Error('Company not found');
      }
      console.log('COMPANY-SERVICE Company found:', existingCompany.id);

      console.log('COMPANY-SERVICE Updating company profile...');
      const company = await this._companyRepository.updateCompanyProfile(
        companyId,
        step2Data,
      );
      console.log('COMPANY-SERVICE Company profile updated successfully');

      console.log('COMPANY-SERVICEUpdating profile step...');
      const profileStep = await this._companyRepository.updateProfileStep(companyId, {
        companyDetailsCompleted: true,
        currentStep: 3,
      });
      console.log('COMPANY-SERVICE Profile step updated successfully:', profileStep);

      return mapCompanyToResponse(company);
    } catch (error) {
      console.error('COMPANY-SERVICE Error in completeStep2 service:', error);
      console.error('COMPANY-SERVICE Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  async completeStep3(companyId: string, step3Data: CompanyRegistrationStep3,): Promise<CompanyResponse> {
    const company = await this._companyRepository.updateCompanyProfile(
      companyId,
      step3Data,
    );

    const updatedCompany = await this._companyRepository.updateCompanyProfile(companyId, {
      ...step3Data,
      profileCompleted: true,
    } as any);

    await this._companyRepository.updateProfileStep(companyId, {
      contactInfoCompleted: true,
      currentStep: 4,
    });

    return mapCompanyToResponse(updatedCompany);
  }

  async getCompanyProfile(companyId: string): Promise<CompanyResponse | null> {
    const company = await this._companyRepository.getCompanyProfile(companyId);
    return company ? mapCompanyToResponse(company) : null;
  }

  async updateCompanyProfile(companyId: string, profileData: Partial<CompanyProfileData>,): Promise<CompanyResponse> {
    const company = await this._companyRepository.updateCompanyProfile(companyId, profileData);
    return mapCompanyToResponse(company);
  }

  async getProfileStep(companyId: string): Promise<CompanyProfileStep | null> {
    return this._companyRepository.getProfileStep(companyId);
  }

  async markStepCompleted(companyId: string, step: number,): Promise<CompanyProfileStep> {
    const updateData: Partial<CompanyProfileStepData> = {
      currentStep: step + 1,
    };

    if (step === 1) updateData.basicInfoCompleted = true;
    if (step === 2) updateData.companyDetailsCompleted = true;
    if (step === 3) updateData.contactInfoCompleted = true;

    return this._companyRepository.updateProfileStep(companyId, updateData);
  }
  async getPendingCompanies(): Promise<CompanyResponse[]> {
    const companies = await this._companyRepository.getPendingCompanies();
    return mapCompaniesToResponse(companies);
  }



  async getAllCompaniesForAdmin(): Promise<CompanyResponse[]> {
    const companies = await this._companyRepository.getAllCompaniesForAdmin();
    return mapCompaniesToResponse(companies);
  }

  async approveCompany(companyId: string, adminId: string): Promise<CompanyResponse> {
    await this._emailService.sendApprovalEmail(
      (await this._companyRepository.getCompanyProfile(companyId))?.email || '',
      (
        await this._companyRepository.getCompanyProfile(companyId)
      )?.companyName || '',
    );

    const company = await this._companyRepository.approveCompany(companyId, adminId);
    return mapCompanyToResponse(company);
  }

  async rejectCompany(companyId: string, reason: string, adminId: string,): Promise<CompanyResponse> {
    const company = await this._companyRepository.getCompanyProfile(companyId);
    if (company) {
      await this._emailService.sendRejectionEmail(
        company.email,
        company.companyName,
        reason,
      );
    }

    const rejectedCompany = await this._companyRepository.rejectCompany(companyId, reason, adminId);
    return mapCompanyToResponse(rejectedCompany);
  }


  async getAllCompaniesForAdminWithPagination(page: number = 1, limit: number = 10): Promise<PaginationResult<CompanyResponse>> {
    const result = await this._companyRepository.getAllCompaniesForAdminWithPagination(page, limit);
    return {
      ...result,
      data: mapCompaniesToResponse(result.data)
    };
  }

  async getCompanyDetailsForAdmin(companyId: string): Promise<CompanyResponse> {
    const company = await this._companyRepository.getCompanyProfile(companyId);
    if (!company) {
      throw new Error('Company not found');
    }
    return mapCompanyToResponse(company);
  }

  async logoutWithToken(refreshToken: string): Promise<void> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as CompanyTokenPayload;
      console.log(`Company ${decoded.email} logged out successfully`);
    } catch (error) {
      console.log('Invalid company refresh token during logout');
    }
  }

  async getCompanyJobCount(companyId: string): Promise<number> {
    try {
      const response = await fetch(`${AppConfig.JOB_SERVICE_URL}/api/jobs/company/${companyId}/count`);
      if (!response.ok) return 0;

      const data = await response.json() as { data: { count: number } };
      return data.data?.count || 0;
    } catch (error) {
      console.error('Error getting job count:', error);
      return 0;
    }
  }

  async reapplyCompany(companyId: string): Promise<{ company: CompanyResponse; message: string }> {
    console.log(' Service reapplyCompany - Company ID:', companyId);

    const company = await this._companyRepository.getCompanyProfile(companyId);
    if (!company) {
      console.log(' Company not found');
      throw new Error('Company not found');
    }

    if (!company.rejectionReason || company.isVerified) {
      console.log('Company is not eligible for reapplication');
      throw new Error('Company is not eligible for reapplication');
    }

    const updatedCompany = await this._companyRepository.updateCompanyProfile(companyId, {
      profileCompleted: false,
      rejectionReason: null,
      reviewedAt: null,
      reviewedBy: null,
    });
    console.log(' Company profile reset successfully');

    const profileStep = await this._companyRepository.updateProfileStep(companyId, {
      basicInfoCompleted: true,
      companyDetailsCompleted: false,
      contactInfoCompleted: false,
      currentStep: 2,
    });
    console.log(' Profile step reset successfully:', profileStep);

    return {
      company: mapCompanyToResponse(updatedCompany),
      message: 'Reapplication initiated successfully. You can now complete your profile from step 2.'
    };
  }

  async getReapplyStatus(companyId: string): Promise<{ canReapply: boolean; rejectionReason?: string; lastReviewedAt?: Date }> {
    console.log(' Service getReapplyStatus - Company ID:', companyId);

    const company = await this._companyRepository.getCompanyProfile(companyId);
    if (!company) {
      console.log(' Company not found');
      throw new Error('Company not found');
    }

    const canReapply = !!(company.rejectionReason && !company.isVerified && !company.isBlocked);

    return {
      canReapply,
      rejectionReason: company.rejectionReason || undefined,
      lastReviewedAt: company.reviewedAt || undefined,
    };
  }

  async searchCompanyByName(companyName: string): Promise<CompanyResponse | null> {
    const company = await this._companyRepository.searchCompanyByName(companyName);
    return company ? mapCompanyToResponse(company) : null;
  }
}
