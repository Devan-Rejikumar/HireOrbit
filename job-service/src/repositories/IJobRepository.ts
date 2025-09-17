import { Job } from '@prisma/client';
import { JobSearchFilters } from '../types/job';
import { UpdateJobInput } from '../services/IJobService';

export interface IJobRepository {
  createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job>;
  getJobById(jobId: string): Promise<Job | null>;
  getAllJobs(): Promise<Job[]>;
  searchJobs(filters: JobSearchFilters): Promise<Job[]>;
  updateJob(id: string, jobData: UpdateJobInput): Promise<Job>;
  deleteJob(id: string): Promise<void>;
  getJobsByCompany(companyId: string): Promise<Job[]>;
  countByCompany(companyId: string): Promise<number>;
  getJobSuggestions(query: string, limit?: number): Promise<string[]>;
}