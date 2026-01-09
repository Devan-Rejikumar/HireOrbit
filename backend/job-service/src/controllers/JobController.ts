import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IJobService } from '../services/interfaces/IJobService';
import { JobStatusCode, ValidationStatusCode, HttpStatusCode } from '../enums/StatusCodes';
import { CreateJobSchema, JobSearchSchema, JobSuggestionsSchema, UpdateJobSchema } from '../dto/schemas/job.schema';
import { buildSuccessResponse } from 'hireorbit-shared-dto';
import { AppError } from '../utils/errors/AppError';
import { Messages } from '../constants/Messages';
import { AppConfig } from '../config/app.config';
import '../types/express'; 

@injectable()
export class JobController {
  constructor(@inject(TYPES.IJobService) private _jobService: IJobService) {}

  async createJob(req: Request, res: Response): Promise<void> {
    const validationResult = CreateJobSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR,
      );
    }
    
    const jobData = validationResult.data;
    const companyId = req.user?.userId;
    
    if (!companyId) {
      throw new AppError(
        Messages.VALIDATION.COMPANY_ID_REQUIRED,
        ValidationStatusCode.MISSING_REQUIRED_FIELDS,
      );
    }
    try {
      const subscriptionServiceUrl = AppConfig.SUBSCRIPTION_SERVICE_URL;
      const limitResponse = await fetch(
        `${subscriptionServiceUrl}/api/subscriptions/limits/job-posting`,
        {
          method: 'GET',
          headers: {
            'Authorization': req.headers.authorization || '',
            'x-company-id': companyId,
            'x-user-id': companyId,
            'x-user-role': 'company',
            'Content-Type': 'application/json',
          },
        },
      );

      if (!limitResponse.ok) {
        const errorData = await limitResponse.json().catch(() => ({})) as { message?: string };
        throw new AppError(
          errorData.message || 'Failed to check job posting limit',
          HttpStatusCode.INTERNAL_SERVER_ERROR,
        );
      }

      const limitData = await limitResponse.json() as { 
        data?: { 
          canPost?: boolean; 
          remaining?: number; 
          limit?: number; 
        } 
      };
      
      if (!limitData.data?.canPost) {
        const remaining = limitData.data?.remaining || 0;
        const limit = limitData.data?.limit || 0;
        throw new AppError(
          `Job posting limit reached. You have posted ${limit} jobs. ${remaining === 0 ? 'Please upgrade your plan to post more jobs.' : `${remaining} jobs remaining.`}`,
          HttpStatusCode.FORBIDDEN,
        );
      }
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error checking job posting limit:', error);
      throw new AppError(
        'Failed to verify job posting limit',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }
    
    const completeJobData = {
      ...jobData,
      companyId: companyId,
      applicationDeadline: new Date(jobData.applicationDeadline),
    };
    
    const job = await this._jobService.createJob(completeJobData);

    try {
      const subscriptionServiceUrl = AppConfig.SUBSCRIPTION_SERVICE_URL;
      await fetch(
        `${subscriptionServiceUrl}/api/subscriptions/increment-job-count`,
        {
          method: 'POST',
          headers: {
            'Authorization': req.headers.authorization || '',
            'x-company-id': companyId,
            'x-user-id': companyId,
            'x-user-role': 'company',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ companyId }),
        },
      );
    } catch (error) {
      console.error('Failed to increment job posting count:', error);
    }
    
    res.status(JobStatusCode.JOB_CREATED).json(
      buildSuccessResponse({ job }, Messages.JOB.CREATED_SUCCESS),
    );
  }

  async getAllJobs(req: Request, res: Response): Promise<void> {
    const jobs = await this._jobService.getAllJobs();
    
    res.status(JobStatusCode.JOBS_RETRIEVED).json(
      buildSuccessResponse({ jobs }, Messages.JOB.RETRIEVED_SUCCESS),
    );
  }

  async getJobById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError(
        Messages.VALIDATION.MISSING_JOB_ID,
        ValidationStatusCode.MISSING_REQUIRED_FIELDS,
      );
    }
    
    const job = await this._jobService.getJobById(id);
    
    if (!job) {
      throw new AppError(
        Messages.JOB.NOT_FOUND,
        JobStatusCode.JOB_NOT_FOUND,
      );
    }
    
    res.status(JobStatusCode.JOB_RETRIEVED).json(
      buildSuccessResponse({ job }, Messages.JOB.RETRIEVED_SUCCESS),
    );
  }

  async searchJobs(req: Request, res: Response): Promise<void> {
    const searchValidation = JobSearchSchema.safeParse(req.query);
    
    if (!searchValidation.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${searchValidation.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR,
      );
    }

    const filters = { ...searchValidation.data };
    if (req.user?.role !== 'admin' && filters.isListed === undefined) {
      filters.isListed = true;
    }
    
    const { jobs, total } = await this._jobService.searchJobs(filters);
    
    res.status(JobStatusCode.JOBS_SEARCHED).json(
      buildSuccessResponse({ jobs, total, page: searchValidation.data.page || 1, limit: searchValidation.data.limit || 10 }, Messages.JOB.SEARCHED_SUCCESS),
    );
  }

  async getJobSuggestions(req: Request, res: Response): Promise<void> {
    const validationResult = JobSuggestionsSchema.safeParse(req.query);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR,
      );
    }
    
    const { q } = validationResult.data;
    const suggestions = await this._jobService.getJobSuggestions(q);
    
    res.status(JobStatusCode.SUGGESTIONS_RETRIEVED).json(
      buildSuccessResponse({ suggestions }, Messages.JOB.SUGGESTIONS_RETRIEVED_SUCCESS),
    );
  }

  async getJobCountByCompany(req: Request, res: Response): Promise<void> {
    const { companyId } = req.params;
    
    const count = await this._jobService.getJobCountByCompany(companyId);
    
    res.status(JobStatusCode.JOBS_RETRIEVED).json(
      buildSuccessResponse({ count }, Messages.JOB.COUNT_RETRIEVED_SUCCESS),
    );
  }

  async getTotalJobCount(req: Request, res: Response): Promise<void> {
    const total = await this._jobService.getTotalJobCount();
    res.status(JobStatusCode.JOBS_RETRIEVED).json(
      buildSuccessResponse({ total }, 'Total job count retrieved successfully'),
    );
  }

  async getJobStatisticsByTimePeriod(req: Request, res: Response): Promise<void> {
    const { startDate, endDate, groupBy } = req.query;
    
    if (!startDate || !endDate || !groupBy) {
      throw new AppError('startDate, endDate, and groupBy are required', ValidationStatusCode.VALIDATION_ERROR);
    }

    if (!['day', 'week', 'month'].includes(groupBy as string)) {
      throw new AppError('groupBy must be day, week, or month', ValidationStatusCode.VALIDATION_ERROR);
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const statistics = await this._jobService.getJobStatisticsByTimePeriod(
      start, 
      end, 
      groupBy as 'day' | 'week' | 'month',
    );

    res.status(JobStatusCode.JOBS_RETRIEVED).json(
      buildSuccessResponse({ statistics }, 'Job statistics retrieved successfully'),
    );
  }

  async getTopCompaniesByJobCount(req: Request, res: Response): Promise<void> {
    const limit = parseInt(req.query.limit as string) || 10;
    const companies = await this._jobService.getTopCompaniesByJobCount(limit);
    
    res.status(JobStatusCode.JOBS_RETRIEVED).json(
      buildSuccessResponse({ companies }, 'Top companies retrieved successfully'),
    );
  }

  async getJobsByCompany(req: Request, res: Response): Promise<void> {
    const { companyId } = req.params;
    
    if (!companyId) {
      throw new AppError(
        Messages.VALIDATION.MISSING_COMPANY_ID,
        ValidationStatusCode.MISSING_REQUIRED_FIELDS,
      );
    }
    
    const jobs = await this._jobService.getJobsByCompany(companyId);
    
    res.status(JobStatusCode.JOBS_RETRIEVED).json(
      buildSuccessResponse({ jobs }, Messages.JOB.RETRIEVED_SUCCESS),
    );
  }

  async updateJob(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError(
        Messages.VALIDATION.MISSING_JOB_ID,
        ValidationStatusCode.MISSING_REQUIRED_FIELDS,
      );
    }

    const validationResult = UpdateJobSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR,
      );
    }

    const jobData = {
      ...validationResult.data,
      applicationDeadline: validationResult.data.applicationDeadline 
        ? new Date(validationResult.data.applicationDeadline) 
        : undefined,
    };
    
    const job = await this._jobService.updateJob(id, jobData);
    
    res.status(JobStatusCode.JOB_UPDATED).json(
      buildSuccessResponse({ job }, Messages.JOB.UPDATED_SUCCESS),
    );
  }

  async deleteJob(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError(
        Messages.VALIDATION.MISSING_JOB_ID,
        ValidationStatusCode.MISSING_REQUIRED_FIELDS,
      );
    }
    
    await this._jobService.deleteJob(id);
    
    res.status(JobStatusCode.JOB_DELETED).json(
      buildSuccessResponse({}, Messages.JOB.DELETED_SUCCESS),
    );
  }

  async toggleJobListing(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const companyId = req.user?.userId;
    const { isListed } = req.body;

    if (!id) {
      throw new AppError(
        Messages.VALIDATION.MISSING_JOB_ID,
        ValidationStatusCode.MISSING_REQUIRED_FIELDS,
      );
    }

    if (!companyId) {
      throw new AppError(
        Messages.VALIDATION.COMPANY_ID_REQUIRED,
        ValidationStatusCode.MISSING_REQUIRED_FIELDS,
      );
    }

    if (typeof isListed !== 'boolean') {
      throw new AppError(
        'isListed must be a boolean',
        ValidationStatusCode.VALIDATION_ERROR,
      );
    }

    const job = await this._jobService.toggleJobListing(id, companyId, isListed, req.headers.authorization);
    
    res.status(JobStatusCode.JOB_UPDATED).json(
      buildSuccessResponse({ job }, Messages.JOB.LISTING_TOGGLED_SUCCESS),
    );
  }
}