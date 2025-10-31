import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IJobService } from '../services/interface/IJobService';
import { HttpStatusCode, JobStatusCode, ValidationStatusCode } from '../enums/StatusCodes';
import { CreateJobSchema, JobSearchSchema, JobSuggestionsSchema, UpdateJobSchema } from '../dto/schemas/job.schema';
import { buildErrorResponse, buildSuccessResponse } from 'shared-dto';

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
    try {
       console.log('JobController: req.user =', req.user);
    console.log('JobController: req.headers =', req.headers);
    console.log('JobController: req.cookies =', req.cookies);
      const validationResult = CreateJobSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
      
      const jobData = validationResult.data;
      const companyId = req.user?.userId || req.headers['x-user-id'] as string;
          if (!companyId) {
      res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json(
        buildErrorResponse('Company ID is required', 'User must be authenticated to create jobs')
      );
      return;
    }
      
      const completeJobData = {
        ...jobData,
        companyId: companyId,
        applicationDeadline: new Date(jobData.applicationDeadline),
      };
      
      const job = await this._jobService.createJob(completeJobData);
      
      res.status(JobStatusCode.JOB_CREATED).json(
        buildSuccessResponse({ job }, 'Job created successfully')
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Job creation failed', errorMessage)
      );
    }
  }

  async getAllJobs(req: Request, res: Response): Promise<void> {
    try {
      const jobs = await this._jobService.getAllJobs();
      
      res.status(JobStatusCode.JOBS_RETRIEVED).json(
        buildSuccessResponse({ jobs }, 'Jobs retrieved successfully')
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Failed to retrieve jobs', errorMessage)
      );
    }
  }

  async getJobById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json(
          buildErrorResponse('Job ID is required', 'Missing job ID parameter')
        );
        return;
      }
      
      const job = await this._jobService.getJobById(id);
      
      if (!job) {
        res.status(JobStatusCode.JOB_NOT_FOUND).json(
          buildErrorResponse('Job not found', 'No job found with the provided ID')
        );
        return;
      }
      
      res.status(JobStatusCode.JOB_RETRIEVED).json(
        buildSuccessResponse({ job }, 'Job retrieved successfully')
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Failed to retrieve job', errorMessage)
      );
    }
  }

  async searchJobs(req: Request, res: Response): Promise<void> {
    try {
      const searchValidation = JobSearchSchema.safeParse(req.query);
      
      if (!searchValidation.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', searchValidation.error.message)
        );
        return;
      }
      
      const jobs = await this._jobService.searchJobs(searchValidation.data);
      
      res.status(JobStatusCode.JOBS_SEARCHED).json(
        buildSuccessResponse({ jobs }, 'Jobs searched successfully')
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Job search failed', errorMessage)
      );
    }
  }

  async getJobSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = JobSuggestionsSchema.safeParse(req.query);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
      
      const { q } = validationResult.data;
      const suggestions = await this._jobService.getJobSuggestions(q);
      
      res.status(JobStatusCode.SUGGESTIONS_RETRIEVED).json(
        buildSuccessResponse({ suggestions }, 'Job suggestions retrieved successfully')
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Failed to get job suggestions', errorMessage)
      );
    }
  }

  async getJobCountByCompany(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      
      const count = await this._jobService.getJobCountByCompany(companyId);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ count }, 'Job count retrieved successfully')
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Failed to get job count', errorMessage)
      );
    }
  }

  async getJobsByCompany(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      
      if (!companyId) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json(
          buildErrorResponse('Company ID is required', 'Missing company ID parameter')
        );
        return;
      }
      
      const jobs = await this._jobService.getJobsByCompany(companyId);
      
      res.status(JobStatusCode.JOBS_RETRIEVED).json(
        buildSuccessResponse({ jobs }, 'Jobs retrieved successfully')
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Failed to retrieve jobs', errorMessage)
      );
    }
  }

  async updateJob(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json(
          buildErrorResponse('Job ID is required', 'Missing job ID parameter')
        );
        return;
      }

      const validationResult = UpdateJobSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }

      const jobData = {
        ...validationResult.data,
        applicationDeadline: validationResult.data.applicationDeadline 
          ? new Date(validationResult.data.applicationDeadline) 
          : undefined,
      };
      
      const job = await this._jobService.updateJob(id, jobData);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ job }, 'Job updated successfully')
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Job update failed', errorMessage)
      );
    }
  }

  async deleteJob(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json(
          buildErrorResponse('Job ID is required', 'Missing job ID parameter')
        );
        return;
      }
      
      await this._jobService.deleteJob(id);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({}, 'Job deleted successfully')
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Job deletion failed', errorMessage)
      );
    }
  }
}