import { injectable } from 'inversify';
import { prisma } from '../../prisma/client';
import { Company, CompanyProfileStep, Otp } from '@prisma/client'; 
import { ICompanyRepository } from '../interface/ICompanyRepository';
import { BaseRepository } from '../implementation/BaseRepository';
import { PaginationResult } from '../interface/IBaseRepository';
import { CompanyProfileData, CompanyProfileStepData } from '../../types/company';

@injectable()
export class CompanyRepository extends BaseRepository<Company> implements ICompanyRepository {
    
  protected getModel() {
    return prisma.company;
  }

  async findByEmail(email: string): Promise<Company | null> {
    return this.findOne({ email });
  }

  async createCompany(data: { email: string; password: string; companyName: string }): Promise<Company> {
    return this.create(data);
  }

  async getAllCompaniesWithPagination(page: number = 1, limit: number = 10): Promise<PaginationResult<Company>> {
    return this.findWithPagination(page, limit);
  }

  async blockCompany(id: string): Promise<Company> {
    return this.update(id, { isBlocked: true });
  }

  async unblockCompany(id: string): Promise<Company> {
    return this.update(id, { isBlocked: false });
  }
    
  async saveOTP(email: string, otp: number): Promise<Otp> {
    return prisma.otp.create({ data: { email, otp } });
  }

  async findOTP(email: string): Promise<Otp | null> {
    return prisma.otp.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteOtp(email: string): Promise<void> {
    await prisma.otp.deleteMany({ where: { email } });
  }

  async updateCompanyProfile(companyId: string, profileData: Partial<CompanyProfileData>): Promise<Company> {
    return this.update(companyId, profileData);
  }

  async getCompanyProfile(companyId: string): Promise<Company | null> {
    return prisma.company.findUnique({
      where: { id: companyId },
      include: { profileStep: true },
    });
  }

  async createProfileStep(companyId: string): Promise<CompanyProfileStep> {
    return prisma.companyProfileStep.create({
      data: { companyId, currentStep: 1 },
    });
  }

  async getProfileStep(companyId: string): Promise<CompanyProfileStep | null> {
    return prisma.companyProfileStep.findUnique({
      where: { companyId },
    });
  }

  async updateProfileStep(companyId: string, stepData: Partial<CompanyProfileStepData>): Promise<CompanyProfileStep> {
    return prisma.companyProfileStep.upsert({
      where: { companyId: companyId },
      update: stepData,
      create: {
        companyId: companyId,
        basicInfoCompleted: stepData.basicInfoCompleted || false,
        companyDetailsCompleted: stepData.companyDetailsCompleted || false,
        contactInfoCompleted: stepData.contactInfoCompleted || false,
        currentStep: stepData.currentStep || 2,
      },
    });
  }

  async getPendingCompanies(): Promise<Company[]> {
    return this.findMany({
      profileCompleted: true,
      isVerified: false,
      isBlocked: false,
    });
  }

  async getAllCompaniesForAdmin(): Promise<Company[]> {
    return this.findMany({ isBlocked: false });
  }

  async getAllCompaniesForAdminWithPagination(page: number, limit: number): Promise<PaginationResult<Company>> {
    return this.findWithPagination(page, limit, { isBlocked: false });
  }

  async approveCompany(companyId: string, adminId: string): Promise<Company> {
    return this.update(companyId, {
      isVerified: true,
      reviewedAt: new Date(),
      reviewedBy: adminId,
      rejectionReason: null,
    });
  }

  async rejectCompany(companyId: string, reason: string, adminId: string): Promise<Company> {
    return this.update(companyId, {
      isVerified: false,
      rejectionReason: reason,
      reviewedAt: new Date(),
      reviewedBy: adminId,
      
    });
  }

  async searchCompanyByName(companyName: string): Promise<Company | null> {
    return prisma.company.findFirst({
      where:{companyName:{equals: companyName, mode:'insensitive'}}
    })
  }
}
