import { injectable, inject } from 'inversify';
import { Job } from '@prisma/client';
import { IJobService } from '../interfaces/IJobService';
import { UpdateJobInput } from '../../types/job';
import { IJobRepository } from '../../repositories/interfaces/IJobRepository';
import { JobSearchFilters } from '../../types/job';
import TYPES from '../../config/types';
import { mapJobToResponse, mapJobsToResponse } from '../../dto/mappers/job.mapper';
import { JobResponse } from '../../dto/responses/job.response';
import { AppError } from '../../utils/errors/AppError';
import { Messages } from '../../constants/Messages';
import { HttpStatusCode } from '../../enums/StatusCodes';
import { AppConfig } from '../../config/app.config';

@injectable()
export class JobService implements IJobService {
  constructor(
    @inject(TYPES.IJobRepository) private _jobRepository: IJobRepository,
  ) {}

  async createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobResponse> {
    const existingJobs = await this._jobRepository.findByCompany(jobData.companyId || '');
    const duplicate = existingJobs.find(job => 
      job.title.toLowerCase() === jobData.title.toLowerCase(),
    );
    
    if (duplicate) {
      throw new AppError(Messages.JOB.DUPLICATE_TITLE, HttpStatusCode.CONFLICT);
    }

    const job = await this._jobRepository.create(jobData);
    return mapJobToResponse(job);
  }

  async getJobById(jobId: string): Promise<JobResponse | null> {
    const job = await this._jobRepository.findById(jobId);
    
    if (!job) {
      return null;
    }
    
    return mapJobToResponse(job);
  }

  async getAllJobs(): Promise<JobResponse[]> {
    const jobs = await this._jobRepository.findAll();
    return mapJobsToResponse(jobs);
  }

  async searchJobs(filters: JobSearchFilters): Promise<{ jobs: JobResponse[]; total: number }> {
    const [jobs, total] = await Promise.all([
      this._jobRepository.search(filters),
      this._jobRepository.count(filters),
    ]);
    return {
      jobs: mapJobsToResponse(jobs),
      total,
    };
  }

  async getJobSuggestions(query: string, limit?: number): Promise<string[]> {
    const processedLimit = Math.min(
      limit || AppConfig.JOB_SUGGESTION_MIN_LIMIT, 
      AppConfig.JOB_SUGGESTION_MAX_LIMIT,
    );
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

  async getTotalJobCount(): Promise<number> {
    return this._jobRepository.getTotalJobCount();
  }

  async getJobStatisticsByTimePeriod(
    startDate: Date, 
    endDate: Date, 
    groupBy: 'day' | 'week' | 'month',
  ): Promise<Array<{ date: string; count: number }>> {
    return this._jobRepository.getJobStatisticsByTimePeriod(startDate, endDate, groupBy);
  }

  async getTopCompaniesByJobCount(limit: number): Promise<Array<{ companyId: string; companyName: string; jobCount: number }>> {
    return this._jobRepository.getTopCompaniesByJobCount(limit);
  }
}