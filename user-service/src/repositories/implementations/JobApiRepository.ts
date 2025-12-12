import { injectable } from 'inversify';
import axios from 'axios';
import { AppConfig } from '../../config/app.config';
import { TimeSeriesDataPoint } from '../../types/admin';

export interface IJobApiRepository {
  getTotalJobCount(): Promise<number>;
  getJobStatisticsByTimePeriod(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month' | 'year'): Promise<TimeSeriesDataPoint[]>;
  getTopCompaniesByJobCount(limit: number): Promise<Array<{ companyId: string; companyName: string; jobCount: number }>>;
}

@injectable()
export class JobApiRepository implements IJobApiRepository {
  private readonly _baseUrl = AppConfig.JOB_SERVICE_URL;

  async getTotalJobCount(): Promise<number> {
    try {
      const url = `${this._baseUrl}/api/jobs/admin/statistics/total`;
      console.log(`[JobApiRepository] Fetching total job count from: ${url}`);
      const response = await axios.get<{ data?: { total: number }; total?: number }>(url, {
        timeout: 5000
      });
      return response.data.data?.total || response.data.total || 0;
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        console.error(`[JobApiRepository] Cannot connect to job service at ${this._baseUrl}. Is it running?`);
      } else {
        console.error('[JobApiRepository] Error fetching total job count:', err.message);
      }
      return 0;
    }
  }

  async getJobStatisticsByTimePeriod(
    startDate: Date, 
    endDate: Date, 
    groupBy: 'day' | 'week' | 'month' | 'year'
  ): Promise<TimeSeriesDataPoint[]> {
    try {
      const url = `${this._baseUrl}/api/jobs/admin/statistics/time-series`;
      console.log(`[JobApiRepository] Fetching job statistics from: ${url}`);
      const response = await axios.get<{ data?: { statistics: TimeSeriesDataPoint[] }; statistics?: TimeSeriesDataPoint[] }>(url, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy
        },
        timeout: 10000
      });
      return response.data.data?.statistics || response.data.statistics || [];
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        console.error(`[JobApiRepository] Cannot connect to job service at ${this._baseUrl}. Is it running?`);
      } else {
        console.error('[JobApiRepository] Error fetching job statistics:', err.message);
      }
      return [];
    }
  }

  async getTopCompaniesByJobCount(limit: number): Promise<Array<{ companyId: string; companyName: string; jobCount: number }>> {
    try {
      const url = `${this._baseUrl}/api/jobs/admin/top-companies`;
      console.log(`[JobApiRepository] Fetching top companies from: ${url}`);
      const response = await axios.get<{ data?: { companies: Array<{ companyId: string; companyName: string; jobCount: number }> }; companies?: Array<{ companyId: string; companyName: string; jobCount: number }> }>(url, {
        params: { limit },
        timeout: 5000
      });
      return response.data.data?.companies || response.data.companies || [];
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        console.error(`[JobApiRepository] Cannot connect to job service at ${this._baseUrl}. Is it running?`);
      } else {
        console.error('[JobApiRepository] Error fetching top companies:', err.message);
      }
      return [];
    }
  }
}

