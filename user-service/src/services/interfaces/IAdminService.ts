import { UserResponse } from '../../dto/responses/user.response';
import { CompanyApprovalResponse, Company } from '../../types/company';

export interface IAdminService{
    login(email:string,password:string):Promise<{admin:UserResponse;tokens:{accessToken:string;refreshToken:string}}>;
    refreshToken(refreshToken: string): Promise<{ accessToken: string }>;
    logoutWithToken(refreshToken: string): Promise<void>;
    getAllUsers():Promise<UserResponse[]>;
    getAllUsersWithPagination(page?: number, limit?: number): Promise<{ data: UserResponse[]; total: number; page: number; totalPages: number }>;
    getPendingCompanies(): Promise<Company[]>;
    approveCompany(companyId: string, adminId: string): Promise<CompanyApprovalResponse>;
    rejectCompany(companyId: string, reason: string, adminId: string): Promise<CompanyApprovalResponse>;
}