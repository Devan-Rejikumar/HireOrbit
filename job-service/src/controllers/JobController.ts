import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IJobService, UpdateJobInput } from '../services/IJobService';
import { HttpStatusCode, JobStatusCode, ValidationStatusCode } from '../enums/StatusCodes';
import { CreateJobSchema, JobSearchSchema, JobSuggestionsSchema } from '../dto/schemas/job.schema';
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
  constructor(@inject(TYPES.IJobService) private jobService: IJobService) {
    console.log('🔍 JobController: Constructor called');
  }

async createJob(req: Request, res: Response): Promise<void> {
  try {
    console.log('🔍 [JobController] createJob called');
    console.log('🔍 [JobController] Request body:', req.body);
    console.log('�� [JobController] User from token:', req.user);
    
    const validationResult = CreateJobSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.log('❌ [JobController] Validation failed:', validationResult.error);
      res.status(ValidationStatusCode.VALIDATION_ERROR).json(
        buildErrorResponse('Validation failed', validationResult.error.message),
      );
      return;
    }
    
    const jobData = validationResult.data;
    console.log('✅ [JobController] Validation passed, jobData:', jobData);
  
    const companyId = req.user?.userId; 
    console.log('�� [JobController] companyId from token:', companyId);
 
    const applicationDeadlineDate = new Date(jobData.applicationDeadline);
    console.log('�� [JobController] applicationDeadline converted:', applicationDeadlineDate);
    
    const completeJobData = {
      ...jobData,
      companyId: companyId || null,
      applicationDeadline: applicationDeadlineDate,
    };
    
    console.log('🔍 [JobController] Complete job data:', completeJobData);
    
    const job = await this.jobService.createJob(completeJobData);
    console.log('✅ [JobController] Job created successfully:', job);
    
    res.status(JobStatusCode.JOB_CREATED).json(
      buildSuccessResponse({ job }, 'Job created successfully'),
    );
  } catch (err) {
    console.error('❌ [JobController] Error in createJob:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
      buildErrorResponse('Job creation failed', errorMessage),
    );
  }
}

  async getAllJobs(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [JobController] getAllJobs called');
      const jobs = await this.jobService.getAllJobs();
      console.log('✅ [JobController] Jobs retrieved:', jobs.length, 'jobs');
      
      res.status(JobStatusCode.JOBS_RETRIEVED).json(
        buildSuccessResponse({ jobs }, 'Jobs retrieved successfully'),
      );
    } catch (err) {
      console.error('❌ [JobController] Error in getAllJobs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Failed to retrieve jobs', errorMessage),
      );
    }
  }

  async getJobById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json(
          buildErrorResponse('Job ID is required', 'Missing job ID parameter'),
        );
        return;
      }
      
      const job = await this.jobService.getJobById(id);
      
      if (!job) {
        res.status(JobStatusCode.JOB_NOT_FOUND).json(
          buildErrorResponse('Job not found', 'No job found with the provided ID'),
        );
        return;
      }
      
      res.status(JobStatusCode.JOB_RETRIEVED).json(
        buildSuccessResponse({ job }, 'Job retrieved successfully'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Failed to retrieve job', errorMessage),
      );
    }
  }

  async searchJobs(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [JobController] searchJobs called with query params:', req.query);
      
      const searchValidation = JobSearchSchema.safeParse(req.query);
      
      if (!searchValidation.success) {
        console.log('❌ [JobController] Validation failed:', searchValidation.error);
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', searchValidation.error.message),
        );
        return;
      }
      
      console.log('✅ [JobController] Validation passed, search filters:', searchValidation.data);
      
      const jobs = await this.jobService.searchJobs(searchValidation.data);
      
      console.log('✅ [JobController] Search completed, found', jobs.length, 'jobs');
      
      res.status(JobStatusCode.JOBS_SEARCHED).json(
        buildSuccessResponse({ jobs }, 'Jobs searched successfully'),
      );
    } catch (err) {
      console.error('❌ [JobController] Error in searchJobs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Job search failed', errorMessage),
      );
    }
  }

  async getJobSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = JobSuggestionsSchema.safeParse(req.query);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message),
        );
        return;
      }
      
      const { q } = validationResult.data;
      const suggestions = await this.jobService.getJobSuggestions(q);
      
      res.status(JobStatusCode.SUGGESTIONS_RETRIEVED).json(
        buildSuccessResponse({ suggestions }, 'Job suggestions retrieved successfully'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Failed to get job suggestions', errorMessage),
      );
    }
  }

  async getJobCountByCompany(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [JobController] getJobCountByCompany called');
      const { companyId } = req.params;
      console.log('🔍 [JobController] companyId:', companyId);
      
      const count = await this.jobService.getJobCountByCompany(companyId);
      console.log('✅ [JobController] count:', count);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ count }, 'Job count retrieved successfully'),
      );
    } catch (err) {
      console.error('❌ [JobController] Error in getJobCountByCompany:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Failed to get job count', errorMessage),
      );
    }
  }

  async getJobsByCompany(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      
      if (!companyId) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json(
          buildErrorResponse('Company ID is required', 'Missing company ID parameter'),
        );
        return;
      }
      
      const jobs = await this.jobService.getJobsByCompany(companyId);
      
      res.status(JobStatusCode.JOBS_RETRIEVED).json(
        buildSuccessResponse({ jobs }, 'Jobs retrieved successfully'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Failed to retrieve jobs', errorMessage),
      );
    }
  }

async updateJob(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json(
        buildErrorResponse('Job ID is required', 'Missing job ID parameter'),
      );
      return;
    }

    const validationResult = CreateJobSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      res.status(ValidationStatusCode.VALIDATION_ERROR).json(
        buildErrorResponse('Validation failed', validationResult.error.message),
      );
      return;
    }

    const jobData: UpdateJobInput = {
      title: req.body.title,
      description: req.body.description,
      company: req.body.company,
      location: req.body.location,
      salary: req.body.salary ? parseInt(req.body.salary) : null,
      jobType: req.body.jobType,
      requirements: req.body.requirements || [],
      benefits: req.body.benefits || [],
      experienceLevel: req.body.experienceLevel,
      education: req.body.education,
      applicationDeadline: req.body.applicationDeadline ? new Date(req.body.applicationDeadline) : undefined,
      workLocation: req.body.workLocation,
    };
    
    const job = await this.jobService.updateJob(id, jobData);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ job }, 'Job updated successfully'),
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
      buildErrorResponse('Job update failed', errorMessage),
    );
  }
}

  async deleteJob(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json(
          buildErrorResponse('Job ID is required', 'Missing job ID parameter'),
        );
        return;
      }
      
      await this.jobService.deleteJob(id);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({}, 'Job deleted successfully'),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Job deletion failed', errorMessage),
      );
    }
  }
}