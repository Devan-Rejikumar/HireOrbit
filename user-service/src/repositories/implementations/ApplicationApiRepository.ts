import { injectable } from 'inversify';
import axios from 'axios';
import { AppConfig } from '../../config/app.config';
import { TopApplicant, TopJob } from '../../types/admin';

export interface IApplicationApiRepository {
  getTopApplicantsByApplicationCount(limit: number): Promise<TopApplicant[]>;
  getTopJobsByApplicationCount(limit: number): Promise<TopJob[]>;
}

@injectable()
export class ApplicationApiRepository implements IApplicationApiRepository {
  private readonly baseUrl = AppConfig.APPLICATION_SERVICE_URL;

  async getTopApplicantsByApplicationCount(limit: number): Promise<TopApplicant[]> {
    try {
      const url = `${this.baseUrl}/api/applications/admin/top-applicants`;
      console.log(`[ApplicationApiRepository] Fetching top applicants from: ${url}`);
      const response = await axios.get<{ data?: { applicants: TopApplicant[] }; applicants?: TopApplicant[] }>(url, {
        params: { limit },
        timeout: 5000
      });
      return response.data.data?.applicants || response.data.applicants || [];
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.error(`[ApplicationApiRepository] Cannot connect to application service at ${this.baseUrl}. Is it running?`);
      } else {
        console.error(`[ApplicationApiRepository] Error fetching top applicants:`, error.message);
      }
      return [];
    }
  }

  async getTopJobsByApplicationCount(limit: number): Promise<TopJob[]> {
    try {
      const url = `${this.baseUrl}/api/applications/admin/top-jobs`;
      console.log(`[ApplicationApiRepository] Fetching top jobs from: ${url} with limit=${limit}`);
      const response = await axios.get<{ success?: boolean; data?: { jobs: TopJob[] }; jobs?: TopJob[] }>(url, {
        params: { limit },
        timeout: 5000
      });
      
      const jobs = response.data.data?.jobs || response.data.jobs || [];
      console.log(`[ApplicationApiRepository] Extracted ${jobs.length} jobs`);
      
      return jobs;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.error(`[ApplicationApiRepository] Cannot connect to application service at ${this.baseUrl}. Is it running?`);
      } else {
        console.error(`[ApplicationApiRepository] Error fetching top jobs:`, error.message);
        if (error.response) {
          console.error(`[ApplicationApiRepository] Error response:`, error.response.data);
        }
      }
      return [];
    }
  }
}

