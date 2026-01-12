import { Job } from '@prisma/client';
import { JobSearchFilters } from '../../types/job';

export interface IJobRepository {
  create(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job>;
  findById(id: string): Promise<Job | null>;
  findAll(): Promise<Job[]>;
  findByCompany(companyId: string): Promise<Job[]>;
  search(filters: JobSearchFilters): Promise<Job[]>;
  count(filters: JobSearchFilters): Promise<number>;
  update(id: string, data: Partial<Job>): Promise<Job>;
  delete(id: string): Promise<void>;
  countByCompany(companyId: string): Promise<number>;
  getSuggestions(query: string, limit: number): Promise<string[]>;
  getTotalJobCount(): Promise<number>;
  getJobStatisticsByTimePeriod(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month'): Promise<Array<{ date: string; count: number }>>;
  getTopCompaniesByJobCount(limit: number): Promise<Array<{ companyId: string; companyName: string; jobCount: number }>>;
  updateListingStatus(jobId: string, isListed: boolean, listedAt: Date): Promise<Job>;
  bulkUpdateListingStatus(companyId: string, isListed: boolean): Promise<{ count: number }>;
}