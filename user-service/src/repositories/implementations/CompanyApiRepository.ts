import { injectable } from 'inversify';
import axios from 'axios';
import { Company, CompanyApprovalResponse, PendingCompaniesResponse } from '../../types/company';
import { AppConfig } from '../../config/app.config';
import { TimeSeriesDataPoint } from '../../types/admin';

export interface ICompanyApiRepository {
  getPendingCompanies(): Promise<Company[]>;
  approveCompany(companyId: string, adminId: string): Promise<CompanyApprovalResponse>;
  rejectCompany(companyId: string, reason: string, adminId: string): Promise<CompanyApprovalResponse>;
  getTotalCompanyCount(): Promise<number>;
  getCompanyStatisticsByTimePeriod(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month' | 'year'): Promise<TimeSeriesDataPoint[]>;
}

@injectable()
export class CompanyApiRepository implements ICompanyApiRepository {
  private readonly baseUrl = AppConfig.COMPANY_SERVICE_URL;

  async getPendingCompanies(): Promise<Company[]> {
    try {
      const response = await axios.get<PendingCompaniesResponse>(`${this.baseUrl}/api/company/admin/pending`);
      return response.data.companies || [];
    } catch (error: any) {
      console.error(`[CompanyApiRepository] Error fetching pending companies:`, error.message);
      throw new Error('Failed to fetch pending companies');
    }
  }

  async approveCompany(companyId: string, adminId: string): Promise<CompanyApprovalResponse> {
    try {
      const response = await axios.post<CompanyApprovalResponse>(
        `${this.baseUrl}/api/company/admin/${companyId}/approve`,
        { adminId }
      );
      return response.data;
    } catch (error: any) {
      console.error(`[CompanyApiRepository] Error approving company:`, error.message);
      throw new Error('Failed to approve company');
    }
  }

  async rejectCompany(companyId: string, reason: string, adminId: string): Promise<CompanyApprovalResponse> {
    try {
      const response = await axios.post<CompanyApprovalResponse>(
        `${this.baseUrl}/api/company/admin/${companyId}/reject`,
        { reason, adminId }
      );
      return response.data;
    } catch (error: any) {
      console.error(`[CompanyApiRepository] Error rejecting company:`, error.message);
      throw new Error('Failed to reject company');
    }
  }

  async getTotalCompanyCount(): Promise<number> {
    try {
      const url = `${this.baseUrl}/api/company/admin/statistics/total`;
      console.log(`[CompanyApiRepository] Fetching total company count from: ${url}`);
      const response = await axios.get<{ data?: { total: number }; total?: number }>(url, {
        timeout: 5000
      });
      return response.data.data?.total || response.data.total || 0;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.error(`[CompanyApiRepository] Cannot connect to company service at ${this.baseUrl}. Is it running?`);
      } else {
        console.error(`[CompanyApiRepository] Error fetching total company count:`, error.message);
      }
      return 0;
    }
  }

  async getCompanyStatisticsByTimePeriod(
    startDate: Date, 
    endDate: Date, 
    groupBy: 'day' | 'week' | 'month' | 'year'
  ): Promise<TimeSeriesDataPoint[]> {
    try {
      const url = `${this.baseUrl}/api/company/admin/statistics/time-series`;
      const startDateISO = startDate.toISOString();
      const endDateISO = endDate.toISOString();
      
      console.log(`[CompanyApiRepository] Fetching company statistics from: ${url}`, {
        startDate: startDateISO,
        endDate: endDateISO,
        groupBy,
        startDateLocal: startDate.toLocaleString(),
        endDateLocal: endDate.toLocaleString()
      });
      
      const response = await axios.get<{ data?: { statistics: TimeSeriesDataPoint[] }; statistics?: TimeSeriesDataPoint[] }>(url, {
        params: {
          startDate: startDateISO,
          endDate: endDateISO,
          groupBy
        },
        timeout: 10000
      });
      
      const statistics = response.data.data?.statistics || response.data.statistics || [];
      console.log(`[CompanyApiRepository] Received ${statistics.length} statistics data points`);
      
      return statistics;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.error(`[CompanyApiRepository] Cannot connect to company service at ${this.baseUrl}. Is it running?`);
      } else {
        console.error(`[CompanyApiRepository] Error fetching company statistics:`, error.message, error.response?.data);
      }
      return [];
    }
  }
}
