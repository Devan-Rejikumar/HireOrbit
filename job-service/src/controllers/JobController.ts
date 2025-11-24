import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IJobService } from '../services/interface/IJobService';
import { JobStatusCode, ValidationStatusCode } from '../enums/StatusCodes';
import { CreateJobSchema, JobSearchSchema, JobSuggestionsSchema, UpdateJobSchema } from '../dto/schemas/job.schema';
import { buildSuccessResponse } from 'shared-dto';
import { AppError } from '../utils/errors/AppError';
import { Messages } from '../constants/Messages';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        userType: string;
      };
    }
  }
}

@injectable()
export class JobController {
  constructor(@inject(TYPES.IJobService) private _jobService: IJobService) {}

  async createJob(req: Request, res: Response): Promise<void> {
    const validationResult = CreateJobSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR
      );
    }
    
    const jobData = validationResult.data;
    const companyId = req.user?.userId;
    
    if (!companyId) {
      throw new AppError(
        Messages.VALIDATION.COMPANY_ID_REQUIRED,
        ValidationStatusCode.MISSING_REQUIRED_FIELDS
      );
    }
    
    const completeJobData = {
      ...jobData,
      companyId: companyId,
      applicationDeadline: new Date(jobData.applicationDeadline),
    };
    
    const job = await this._jobService.createJob(completeJobData);
    
    res.status(JobStatusCode.JOB_CREATED).json(
      buildSuccessResponse({ job }, Messages.JOB.CREATED_SUCCESS)
    );
  }

  async getAllJobs(req: Request, res: Response): Promise<void> {
    const jobs = await this._jobService.getAllJobs();
    
    res.status(JobStatusCode.JOBS_RETRIEVED).json(
      buildSuccessResponse({ jobs }, Messages.JOB.RETRIEVED_SUCCESS)
    );
  }

  async getJobById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError(
        Messages.VALIDATION.MISSING_JOB_ID,
        ValidationStatusCode.MISSING_REQUIRED_FIELDS
      );
    }
    
    const job = await this._jobService.getJobById(id);
    
    if (!job) {
      throw new AppError(
        Messages.JOB.NOT_FOUND,
        JobStatusCode.JOB_NOT_FOUND
      );
    }
    
    res.status(JobStatusCode.JOB_RETRIEVED).json(
      buildSuccessResponse({ job }, Messages.JOB.RETRIEVED_SUCCESS)
    );
  }

  async searchJobs(req: Request, res: Response): Promise<void> {
    const searchValidation = JobSearchSchema.safeParse(req.query);
    
    if (!searchValidation.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${searchValidation.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR
      );
    }
    
    const { jobs, total } = await this._jobService.searchJobs(searchValidation.data);
    
    res.status(JobStatusCode.JOBS_SEARCHED).json(
      buildSuccessResponse({ jobs, total, page: searchValidation.data.page || 1, limit: searchValidation.data.limit || 10 }, Messages.JOB.SEARCHED_SUCCESS)
    );
  }

  async getJobSuggestions(req: Request, res: Response): Promise<void> {
    const validationResult = JobSuggestionsSchema.safeParse(req.query);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR
      );
    }
    
    const { q } = validationResult.data;
    const suggestions = await this._jobService.getJobSuggestions(q);
    
    res.status(JobStatusCode.SUGGESTIONS_RETRIEVED).json(
      buildSuccessResponse({ suggestions }, Messages.JOB.SUGGESTIONS_RETRIEVED_SUCCESS)
    );
  }

  async getJobCountByCompany(req: Request, res: Response): Promise<void> {
    const { companyId } = req.params;
    
    const count = await this._jobService.getJobCountByCompany(companyId);
    
    res.status(JobStatusCode.JOBS_RETRIEVED).json(
      buildSuccessResponse({ count }, Messages.JOB.COUNT_RETRIEVED_SUCCESS)
    );
  }

  async getJobsByCompany(req: Request, res: Response): Promise<void> {
    const { companyId } = req.params;
    
    if (!companyId) {
      throw new AppError(
        Messages.VALIDATION.MISSING_COMPANY_ID,
        ValidationStatusCode.MISSING_REQUIRED_FIELDS
      );
    }
    
    const jobs = await this._jobService.getJobsByCompany(companyId);
    
    res.status(JobStatusCode.JOBS_RETRIEVED).json(
      buildSuccessResponse({ jobs }, Messages.JOB.RETRIEVED_SUCCESS)
    );
  }

  async updateJob(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError(
        Messages.VALIDATION.MISSING_JOB_ID,
        ValidationStatusCode.MISSING_REQUIRED_FIELDS
      );
    }

    const validationResult = UpdateJobSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR
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
      buildSuccessResponse({ job }, Messages.JOB.UPDATED_SUCCESS)
    );
  }

  async deleteJob(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError(
        Messages.VALIDATION.MISSING_JOB_ID,
        ValidationStatusCode.MISSING_REQUIRED_FIELDS
      );
    }
    
    await this._jobService.deleteJob(id);
    
    res.status(JobStatusCode.JOB_DELETED).json(
      buildSuccessResponse({}, Messages.JOB.DELETED_SUCCESS)
    );
  }
}