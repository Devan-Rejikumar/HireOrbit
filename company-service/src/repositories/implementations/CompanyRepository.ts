import { injectable } from 'inversify';
import { prisma } from '../../prisma/client';
import { Company, CompanyProfileStep, Otp } from '@prisma/client'; 
import { ICompanyRepository } from '../interfaces/ICompanyRepository';
import { BaseRepository } from './BaseRepository';
import { PaginationResult } from '../interfaces/IBaseRepository';
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

  async getTotalCompanyCount(): Promise<number> {
    return prisma.company.count();
  }

  async getCompanyStatisticsByTimePeriod(
    startDate: Date, 
    endDate: Date, 
    groupBy: 'day' | 'week' | 'month' | 'year'
  ): Promise<Array<{ date: string; count: number }>> {
    console.log('[CompanyRepository] Querying companies with date range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startDateLocal: startDate.toLocaleString(),
      endDateLocal: endDate.toLocaleString(),
      groupBy
    });
    

    const companies = await prisma.company.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    const allCompanies = await prisma.company.findMany({
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    console.log('[CompanyRepository] Sample of all companies (latest 5):', {
      count: allCompanies.length,
      dates: allCompanies.map(c => ({
        iso: c.createdAt.toISOString(),
        local: c.createdAt.toLocaleString(),
        dateOnly: c.createdAt.toISOString().split('T')[0]
      }))
    });
    
    console.log('[CompanyRepository] Found companies:', {
      count: companies.length,
      dates: companies.map(c => c.createdAt.toISOString())
    });


    const grouped = new Map<string, number>();
    
    companies.forEach(company => {
      const date = new Date(company.createdAt);
      let key: string;
      
      if (groupBy === 'day') {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        key = `${year}-${month}-${day}`; 
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setUTCDate(date.getUTCDate() - date.getUTCDay()); 
        weekStart.setUTCHours(0, 0, 0, 0);
        const year = weekStart.getUTCFullYear();
        const month = String(weekStart.getUTCMonth() + 1).padStart(2, '0');
        const day = String(weekStart.getUTCDate()).padStart(2, '0');
        key = `${year}-${month}-${day}`;
      } else if (groupBy === 'month') {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        key = `${year}-${month}`; 
      } else { 
        const year = date.getUTCFullYear();
        key = `${year}`; 
      }
      
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });
    
    console.log('[CompanyRepository] Grouped companies:', {
      groupedCount: grouped.size,
      groups: Array.from(grouped.entries())
    });

    const allPeriods = new Map<string, number>();

    if (groupBy === 'year') {
      const startYear = new Date(startDate).getUTCFullYear();
      const endYear = new Date(endDate).getUTCFullYear();
      
      for (let y = startYear; y <= endYear; y++) {
        const key = `${y}`;
        allPeriods.set(key, grouped.get(key) || 0);
      }
    } else if (groupBy === 'month') {
      const startYear = new Date(startDate).getUTCFullYear();
      const endYear = new Date(endDate).getUTCFullYear();
      for (let y = startYear; y <= endYear; y++) {
        const startMonth = (y === startYear) ? new Date(startDate).getUTCMonth() : 0;
        const endMonth = (y === endYear) ? new Date(endDate).getUTCMonth() : 11;
        
        for (let m = startMonth; m <= endMonth; m++) {
          const key = `${y}-${String(m + 1).padStart(2, '0')}`;
          allPeriods.set(key, grouped.get(key) || 0);
        }
      }
      } else {
      const current = new Date(startDate);
      current.setUTCHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);

      while (current <= end) {
        let key: string;
        
        if (groupBy === 'day') {
          const year = current.getUTCFullYear();
          const month = String(current.getUTCMonth() + 1).padStart(2, '0');
          const day = String(current.getUTCDate()).padStart(2, '0');
          key = `${year}-${month}-${day}`;
          current.setUTCDate(current.getUTCDate() + 1);
        } else if (groupBy === 'week') {
          const weekStart = new Date(current);
          weekStart.setUTCDate(current.getUTCDate() - current.getUTCDay());
          weekStart.setUTCHours(0, 0, 0, 0);
          const year = weekStart.getUTCFullYear();
          const month = String(weekStart.getUTCMonth() + 1).padStart(2, '0');
          const day = String(weekStart.getUTCDate()).padStart(2, '0');
          key = `${year}-${month}-${day}`;
          current.setUTCDate(current.getUTCDate() + 7);
        } else {
          key = '';
        }
        
        if (key) {
          allPeriods.set(key, grouped.get(key) || 0);
        }
      }
    }
    
    console.log('[CompanyRepository] Generated periods:', {
      periodCount: allPeriods.size,
      periods: Array.from(allPeriods.entries()).slice(0, 10) // Log first 10
    });
    const result = Array.from(allPeriods.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }
}
