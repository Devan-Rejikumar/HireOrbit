import { Company, Otp, CompanyProfileStep } from '@prisma/client';
import { CompanyProfileData, CompanyProfileStepData } from '../types/company';
import { IBaseRepository, PaginationResult } from '../interfaces/IBaseRepository';
export interface ICompanyRepository extends IBaseRepository<Company> {
  findByEmail(email: string): Promise<Company | null>;
  createCompany(data: {
    email: string;
    password: string;
    companyName: string;
  }): Promise<Company>;
  findById(id: string): Promise<Company | null>;
  saveOTP(email: string, otp: number): Promise<Otp>;
  findOTP(email: string): Promise<Otp | null>;
  deleteOtp(email: string): Promise<void>;
  getAllCompaniesWithPagination(page?: number, limit?: number): Promise<PaginationResult<Company>>;
  blockCompany(id: string): Promise<Company>;
  unblockCompany(id: string): Promise<Company>;
  updateCompanyProfile(
    companyId: string,
    profileData: Partial<CompanyProfileData>
  ): Promise<Company>;
  getCompanyProfile(companyId: string): Promise<Company | null>;
  createProfileStep(companyId: string): Promise<CompanyProfileStep>;
  getProfileStep(companyId: string): Promise<CompanyProfileStep | null>;
  updateProfileStep(
    companyId: string,
    stepData: Partial<CompanyProfileStepData>
  ): Promise<CompanyProfileStep>;

  getPendingCompanies(): Promise<Company[]>;
  getAllCompaniesForAdmin(): Promise<Company[]>;
  getAllCompaniesForAdminWithPagination(page: number, limit: number): Promise<PaginationResult<Company>>;
  approveCompany(companyId: string, adminId: string): Promise<Company>;
  rejectCompany(
    companyId: string,
    reason: string,
    adminId: string
  ): Promise<Company>;
  searchCompanyByName(companyName:string):Promise<Company | null>;

}
