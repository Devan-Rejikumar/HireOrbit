import { Job, JobApplication } from '@prisma/client';
import { JobSearchFilters, } from '../types/job';

export interface UpdateJobInput {
  title: string;
  description: string;
  company: string;
  location: string;
  salary?: number | null;
  jobType: string;
  requirements: string[];
  benefits: string[];
  experienceLevel: string;
  education: string;
  applicationDeadline?: Date;
  workLocation: string;
}

export interface IJobService {
  createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job>;
  getJobById(jobId: string): Promise<Job | null>;
  getAllJobs(): Promise<Job[]>;
  searchJobs(filters: JobSearchFilters): Promise<Job[]>;
  updateJob(id: string, jobData: UpdateJobInput): Promise<Job>;
  deleteJob(id: string): Promise<void>;
  getJobsByCompany(companyId: string): Promise<Job[]>;
  getJobCountByCompany(companyId: string): Promise<number>;
  getJobSuggestions(query: string, limit?: number): Promise<string[]>;
}
