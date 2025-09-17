import { injectable, inject } from 'inversify';
import { Job } from '@prisma/client';
import { IJobService, UpdateJobInput } from '../services/IJobService';
import { IJobRepository } from '../repositories/IJobRepository';
import { JobSearchFilters } from '../types/job';
import TYPES from '../config/types';

@injectable()
export class JobService implements IJobService {
  constructor(
    @inject(TYPES.IJobRepository) private readonly jobRepository: IJobRepository,
  ) {}

  async createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
    return this.jobRepository.createJob(jobData);
  }

  async getJobById(jobId: string): Promise<Job | null> {
    return this.jobRepository.getJobById(jobId);
  }

  async getAllJobs(): Promise<Job[]> {
    return this.jobRepository.getAllJobs();
  }

  async searchJobs(filters: JobSearchFilters): Promise<Job[]> {
    return this.jobRepository.searchJobs(filters);
  }

  async getJobSuggestions(query: string, limit?: number): Promise<string[]> {
    return this.jobRepository.getJobSuggestions(query, limit);
  }

  async getJobCountByCompany(companyId: string): Promise<number> {
    console.log('JobService: getJobCountByCompany called with companyId =', companyId);
    const count = await this.jobRepository.countByCompany(companyId);
    console.log('JobService: count returned =', count);
    return count;
  }

  async getJobsByCompany(companyId: string): Promise<Job[]> {
    return this.jobRepository.getJobsByCompany(companyId);
  }

  async updateJob(id: string, jobData: UpdateJobInput): Promise<Job> {
    return this.jobRepository.updateJob(id, jobData);
  }

  async deleteJob(id: string): Promise<void> {
    return this.jobRepository.deleteJob(id);
  }
}