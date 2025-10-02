import { Company, CompanyProfileStep } from '@prisma/client';
import { CompanyProfileData, CompanyProfileStepData,CompanyRegistrationStep1,CompanyRegistrationStep2,CompanyRegistrationStep3,} from '../types/company';

export interface ICompanyService{
    register(email:string,password:string,companyName:string):Promise<Company>;
    login(email:string,password:string):Promise<{company:Company;tokens:{accessToken: string; refreshToken:string}}>;
    refreshToken(refreshToken: string): Promise<{ accessToken: string }>;
    generateOTP(email:string):Promise<{message:string}>
    verifyOTP(email:string,otp:number):Promise<{message:string}>;
    resendOTP(email:string):Promise<{message:string}>;
    getAllCompanies():Promise<Company[]>;
    blockCompany(id:string):Promise<void>;
    unblockCompany(id:string):Promise<void>;
    completeStep2(companyId: string, step2Data: CompanyRegistrationStep2): Promise<Company>;
    completeStep3(companyId: string, step3Data: CompanyRegistrationStep3): Promise<Company>;
    getCompanyProfile(companyId: string): Promise<Company | null>;
    updateCompanyProfile(companyId: string, profileData: Partial<CompanyProfileData>): Promise<Company>;
    getProfileStep(companyId: string): Promise<CompanyProfileStep | null>;
    markStepCompleted(companyId: string, step: number): Promise<CompanyProfileStep>;
    getPendingCompanies(): Promise<Company[]>;
    getAllCompaniesForAdmin(): Promise<Company[]>;
    getCompanyDetailsForAdmin(companyId: string): Promise<Company>;
    approveCompany(companyId: string, adminId: string): Promise<Company>;
    rejectCompany(companyId: string, reason: string, adminId: string): Promise<Company>;
    logoutWithToken(refreshToken: string): Promise<void>;
    getCompanyJobCount(companyId: string): Promise<number>;
    reapplyCompany(companyId: string): Promise<{ company: Company; message: string }>;
    getReapplyStatus(companyId: string): Promise<{ canReapply: boolean; rejectionReason?: string; lastReviewedAt?: Date }>;
    searchCompanyByName(companyName: string): Promise<Company | null>;
}