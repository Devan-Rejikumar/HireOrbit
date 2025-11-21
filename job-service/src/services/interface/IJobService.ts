import { Job } from '@prisma/client';
import { JobSearchFilters } from '../../types/job';
import { JobResponse } from '../../dto/responses/job.response';

export interface UpdateJobInput {
  title?: string;
  description?: string;
  company?: string;
  location?: string;
  salary?: number | null;
  jobType?: string;
  requirements?: string[];
  benefits?: string[];
  experienceLevel?: string;
  education?: string;
  applicationDeadline?: Date;
  workLocation?: string;
}

export interface IJobService {
  createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobResponse>;
  getJobById(jobId: string): Promise<JobResponse | null>;
  getAllJobs(): Promise<JobResponse[]>;
  searchJobs(filters: JobSearchFilters): Promise<{ jobs: JobResponse[]; total: number }>;
  updateJob(id: string, jobData: UpdateJobInput): Promise<JobResponse>;
  deleteJob(id: string): Promise<void>;
  getJobsByCompany(companyId: string): Promise<JobResponse[]>;
  getJobCountByCompany(companyId: string): Promise<number>;
  getJobSuggestions(query: string, limit?: number): Promise<string[]>;
}