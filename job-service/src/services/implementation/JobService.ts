import { injectable, inject } from 'inversify';
import { Job } from '@prisma/client';
import { IJobService, UpdateJobInput } from '../interface/IJobService';
import { IJobRepository } from '../../repositories/interface/IJobRepository';
import { JobSearchFilters } from '../../types/job';
import TYPES from '../../config/types';
import { mapJobToResponse, mapJobsToResponse } from '../../dto/mappers/job.mapper';
import { JobResponse } from '../../dto/responses/job.response';

@injectable()
export class JobService implements IJobService {
  constructor(
    @inject(TYPES.IJobRepository) private _jobRepository: IJobRepository,
  ) {}

  async createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobResponse> {
    const existingJobs = await this._jobRepository.findByCompany(jobData.companyId || '');
    const duplicate = existingJobs.find(job => 
      job.title.toLowerCase() === jobData.title.toLowerCase()
    );
    
    if (duplicate) {
      throw new Error('Job with this title already exists for this company');
    }

    const job = await this._jobRepository.create(jobData);
    return mapJobToResponse(job);
  }

  async getJobById(jobId: string): Promise<JobResponse | null> {
    const job = await this._jobRepository.findById(jobId);
    
    if (!job) {
      console.log('JobService.getJobById - Job not found');
      return null;
    }
    
    // ✅ Add debugging
    console.log('JobService.getJobById - Job found:', job.title);
    console.log('JobService.getJobById - Job isActive:', job.isActive);
    console.log('JobService.getJobById - Job applicationDeadline:', job.applicationDeadline);
    console.log('JobService.getJobById - Current date:', new Date());
    
    // ✅ Check if job is expired (application deadline passed)
    const now = new Date();
    const deadline = new Date(job.applicationDeadline);
    const isExpired = deadline < now;
    
    console.log('JobService.getJobById - Is expired:', isExpired);
    
    // ✅ Return job if it exists and is not expired
    if (isExpired) {
      console.log('JobService.getJobById - Job expired, not returning');
      return null;
    }
    
    return mapJobToResponse(job);
  }

  async getAllJobs(): Promise<JobResponse[]> {
    const jobs = await this._jobRepository.findAll();
    return mapJobsToResponse(jobs);
  }

  async searchJobs(filters: JobSearchFilters): Promise<JobResponse[]> {
    const jobs = await this._jobRepository.search(filters);
    return mapJobsToResponse(jobs);
  }

  async getJobSuggestions(query: string, limit?: number): Promise<string[]> {
    const processedLimit = Math.min(limit || 10, 50);
    return this._jobRepository.getSuggestions(query.trim(), processedLimit);
  }

  async getJobCountByCompany(companyId: string): Promise<number> {
    return this._jobRepository.countByCompany(companyId);
  }

  async getJobsByCompany(companyId: string): Promise<JobResponse[]> {
    const jobs = await this._jobRepository.findByCompany(companyId);
    return mapJobsToResponse(jobs);
  }

  async updateJob(id: string, jobData: UpdateJobInput): Promise<JobResponse> {
    const job = await this._jobRepository.update(id, jobData);
    return mapJobToResponse(job);
  }

  async deleteJob(id: string): Promise<void> {
    await this._jobRepository.delete(id);
  }
}