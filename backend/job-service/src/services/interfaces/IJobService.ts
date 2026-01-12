import { Job } from '@prisma/client';
import { JobSearchFilters, UpdateJobInput } from '../../types/job';
import { JobResponse } from '../../dto/responses/job.response';

export interface IJobService {
  createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'isListed' | 'listedAt'>): Promise<JobResponse>;
  getJobById(jobId: string): Promise<JobResponse | null>;
  getAllJobs(): Promise<JobResponse[]>;
  searchJobs(filters: JobSearchFilters): Promise<{ jobs: JobResponse[]; total: number }>;
  updateJob(id: string, jobData: UpdateJobInput): Promise<JobResponse>;
  deleteJob(id: string): Promise<void>;
  getJobsByCompany(companyId: string): Promise<JobResponse[]>;
  getJobCountByCompany(companyId: string): Promise<number>;
  getJobSuggestions(query: string, limit?: number): Promise<string[]>;
  getTotalJobCount(): Promise<number>;
  getJobStatisticsByTimePeriod(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month'): Promise<Array<{ date: string; count: number }>>;
  getTopCompaniesByJobCount(limit: number): Promise<Array<{ companyId: string; companyName: string; jobCount: number }>>;
  toggleJobListing(jobId: string, companyId: string, isListed: boolean, authToken?: string): Promise<JobResponse>;
  bulkUpdateJobListingByCompany(companyId: string, isListed: boolean): Promise<{ count: number }>;
}