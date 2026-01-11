import { injectable, inject } from 'inversify';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import TYPES from '../../config/types';
import { ICompanyRepository } from '../../repositories/interfaces/ICompanyRepository';
import { ICompanyService } from '../interfaces/ICompanyService';
import { IEmailService } from '../interfaces/IEmailService';
import { CompanyProfileData, CompanyRegistrationStep2, CompanyRegistrationStep3, CompanyProfileStep, CompanyProfileStepData } from '../../types/company';
import { RedisService } from './RedisService';
import { JobServiceClient } from './JobServiceClient';
import { PaginationResult } from '../../repositories/interfaces/IBaseRepository';
import { CompanyAuthResponse, CompanyResponse } from '../../dto/responses/company.response';
import { mapCompaniesToResponse, mapCompanyToAuthResponse, mapCompanyToResponse } from '../../dto/mappers/company.mapper';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY, OTP_MIN_VALUE, OTP_MAX_VALUE, OTP_EXPIRY_SECONDS } from '../../constants/TimeConstants';
import { AppConfig } from '../../config/app.config';
import { AppError } from '../../utils/errors/AppError';
import { HttpStatusCode } from '../../enums/StatusCodes';

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
    @inject(TYPES.JobServiceClient) private _jobServiceClient: JobServiceClient,
  ) { }

  async register(email: string, password: string, companyName: string, logo?: string): Promise<CompanyResponse> {
    const existingCompany = await this._companyRepository.findByEmail(email);
    if (existingCompany) throw new AppError('Company already exists', HttpStatusCode.CONFLICT);
    const hashed = await bcrypt.hash(password, AppConfig.BCRYPT_ROUNDS);
    const company = await this._companyRepository.create({
      email,
      password: hashed,
      companyName,
      logo: logo || undefined,
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
    if (!company) throw new AppError('Invalid credentials', HttpStatusCode.UNAUTHORIZED);
    
    let valid = false;
    
    // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
    if (company.password.startsWith('$2a$') || company.password.startsWith('$2b$')) {
      // Password is hashed - use bcrypt compare
      valid = await bcrypt.compare(password, company.password);
    } else {
      // Password is plain text (legacy) - do direct comparison and rehash
      if (password === company.password) {
        valid = true;
        // Rehash the password for future logins
        const hashedPassword = await bcrypt.hash(password, AppConfig.BCRYPT_ROUNDS);
        await this._companyRepository.updatePassword(company.id, hashedPassword);
        console.log('[CompanyService] Password rehashed for company:', email);
      }
    }
    
    if (!valid) throw new AppError('Invalid credentials', HttpStatusCode.UNAUTHORIZED);
    
    const tokenPayload: Omit<CompanyTokenPayload, 'iat' | 'exp'> = {
      userId: company.id,
      companyId: company.id,
      email: company.email,
      role: 'company',
      userType: 'company',
    };
    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign(tokenPayload, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: REFRESH_TOKEN_EXPIRY });
    return mapCompanyToAuthResponse(company, { accessToken, refreshToken });
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
    } catch {
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
      data: mapCompaniesToResponse(result.data),
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

  async completeStep2(companyId: string, step2Data: CompanyRegistrationStep2): Promise<CompanyResponse> {
    try {
      const existingCompany = await this._companyRepository.getCompanyProfile(companyId);
      if (!existingCompany) {
        throw new Error('Company not found');
      }

      const company = await this._companyRepository.updateCompanyProfile(
        companyId,
        step2Data,
      );
      const profileStep = await this._companyRepository.updateProfileStep(companyId, {
        companyDetailsCompleted: true,
        currentStep: 3,
      });
     

      return mapCompanyToResponse(company);
    } catch (error) {
      throw error;
    }
  }

  async completeStep3(companyId: string, step3Data: CompanyRegistrationStep3): Promise<CompanyResponse> {
    const updatedCompany = await this._companyRepository.updateCompanyProfile(companyId, {
      ...step3Data,
      profileCompleted: true,
    } as Partial<CompanyProfileData>);

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

  async updateCompanyProfile(companyId: string, profileData: Partial<CompanyProfileData>): Promise<CompanyResponse> {
    const company = await this._companyRepository.updateCompanyProfile(companyId, profileData);
    return mapCompanyToResponse(company);
  }

  async getProfileStep(companyId: string): Promise<CompanyProfileStep | null> {
    return this._companyRepository.getProfileStep(companyId);
  }

  async markStepCompleted(companyId: string, step: number): Promise<CompanyProfileStep> {
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

  async rejectCompany(companyId: string, reason: string, adminId: string): Promise<CompanyResponse> {
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
      data: mapCompaniesToResponse(result.data),
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
      
    } catch {
      console.log('Invalid company refresh token during logout');
    }
  }

  async getCompanyJobCount(companyId: string): Promise<number> {
    return await this._jobServiceClient.getCompanyJobCount(companyId);
  }

  async reapplyCompany(companyId: string): Promise<{ company: CompanyResponse; message: string }> {


    const company = await this._companyRepository.getCompanyProfile(companyId);
    if (!company) {
      
      throw new Error('Company not found');
    }

    if (!company.rejectionReason || company.isVerified) {
     
      throw new Error('Company is not eligible for reapplication');
    }

    const updatedCompany = await this._companyRepository.updateCompanyProfile(companyId, {
      profileCompleted: false,
      rejectionReason: null,
      reviewedAt: null,
      reviewedBy: null,
    });
   

    const profileStep = await this._companyRepository.updateProfileStep(companyId, {
      basicInfoCompleted: true,
      companyDetailsCompleted: false,
      contactInfoCompleted: false,
      currentStep: 2,
    });
    
    return {
      company: mapCompanyToResponse(updatedCompany),
      message: 'Reapplication initiated successfully. You can now complete your profile from step 2.',
    };
  }

  async getReapplyStatus(companyId: string): Promise<{ canReapply: boolean; rejectionReason?: string; lastReviewedAt?: Date }> {
   
    const company = await this._companyRepository.getCompanyProfile(companyId);
    if (!company) {
     
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

  async getTotalCompanyCount(): Promise<number> {
    return this._companyRepository.getTotalCompanyCount();
  }

  async getCompanyStatisticsByTimePeriod(
    startDate: Date, 
    endDate: Date, 
    groupBy: 'day' | 'week' | 'month' | 'year',
  ): Promise<Array<{ date: string; count: number }>> {
    return this._companyRepository.getCompanyStatisticsByTimePeriod(startDate, endDate, groupBy);
  }
}
