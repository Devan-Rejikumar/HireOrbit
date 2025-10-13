import { Company, CompanyProfileStep } from '@prisma/client';
import { CompanyProfileData, CompanyProfileStepData,CompanyRegistrationStep1,CompanyRegistrationStep2,CompanyRegistrationStep3,} from '../../types/company';
import { CompanyAuthResponse, CompanyResponse } from '../../dto/responses/company.response';

export interface ICompanyService{
    register(email:string,password:string,companyName:string):Promise<CompanyResponse>;
    login(email:string,password:string):Promise<CompanyAuthResponse>;
    refreshToken(refreshToken: string): Promise<{ accessToken: string }>;
    generateOTP(email:string):Promise<{message:string}>
    verifyOTP(email:string,otp:number):Promise<{message:string}>;
    resendOTP(email:string):Promise<{message:string}>;
    getAllCompanies():Promise<CompanyResponse[]>;
    blockCompany(id:string):Promise<void>;
    unblockCompany(id:string):Promise<void>;
    completeStep2(companyId: string, step2Data: CompanyRegistrationStep2): Promise<CompanyResponse>;
    completeStep3(companyId: string, step3Data: CompanyRegistrationStep3): Promise<CompanyResponse>;
    getCompanyProfile(companyId: string): Promise<CompanyResponse | null>;
    updateCompanyProfile(companyId: string, profileData: Partial<CompanyProfileData>): Promise<CompanyResponse>;
    getProfileStep(companyId: string): Promise<CompanyProfileStep | null>;
    markStepCompleted(companyId: string, step: number): Promise<CompanyProfileStep>;
    getPendingCompanies(): Promise<CompanyResponse[]>;
    getAllCompaniesForAdmin(): Promise<CompanyResponse[]>;
    getCompanyDetailsForAdmin(companyId: string): Promise<CompanyResponse>;
    approveCompany(companyId: string, adminId: string): Promise<CompanyResponse>;
    rejectCompany(companyId: string, reason: string, adminId: string): Promise<CompanyResponse>;
    logoutWithToken(refreshToken: string): Promise<void>;
    getCompanyJobCount(companyId: string): Promise<number>;
    reapplyCompany(companyId: string): Promise<{ company: CompanyResponse; message: string }>;
    getReapplyStatus(companyId: string): Promise<{ canReapply: boolean; rejectionReason?: string; lastReviewedAt?: Date }>;
    searchCompanyByName(companyName: string): Promise<CompanyResponse | null>;
}