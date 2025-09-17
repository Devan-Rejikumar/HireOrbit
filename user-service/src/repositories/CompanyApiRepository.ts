import { injectable } from 'inversify';
import { Company, CompanyApprovalResponse, PendingCompaniesResponse } from '../types/company';

export interface ICompanyApiRepository {
  getPendingCompanies(): Promise<Company[]>;
  approveCompany(companyId: string, adminId: string): Promise<CompanyApprovalResponse>;
  rejectCompany(companyId: string, reason: string, adminId: string): Promise<CompanyApprovalResponse>;
}

@injectable()
export class CompanyApiRepository implements ICompanyApiRepository {
  private readonly baseUrl = 'http://localhost:3001/api/company';

  async getPendingCompanies(): Promise<Company[]> {
    const response = await fetch(`${this.baseUrl}/admin/pending`);
    if (!response.ok) {
      throw new Error('Failed to fetch pending companies');
    }
    const data: PendingCompaniesResponse = await response.json();
    return data.companies || [];
  }

  async approveCompany(companyId: string, adminId: string): Promise<CompanyApprovalResponse> {
    const response = await fetch(`${this.baseUrl}/admin/${companyId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adminId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to approve company');
    }
    
    return await response.json() as CompanyApprovalResponse;
  }

  async rejectCompany(companyId: string, reason: string, adminId: string): Promise<CompanyApprovalResponse> {
    const response = await fetch(`${this.baseUrl}/admin/${companyId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason, adminId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to reject company');
    }
    
    return await response.json() as CompanyApprovalResponse;
  }
}
