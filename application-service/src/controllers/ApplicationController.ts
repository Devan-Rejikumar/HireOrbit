import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { ZodError } from "zod";
import { IApplicationService } from "../services/IApplicationService";
import { CreateApplicationSchema, UpdateApplicationStatusSchema, AddApplicationNoteSchema } from "../dto/schemas/application.schema";
import { buildSuccessResponse, buildErrorResponse } from "../../../shared-dto/src";
import { HttpStatusCode } from "../enums/StatusCodes";
import { TYPES } from '../config/types';
import { uploadToCloudinary } from '../config/cloudinary';

// Define AuthRequest interface for header-based authentication
interface AuthRequest extends Request {
  headers: {
    'x-user-id'?: string;
    'x-user-email'?: string;
    'x-user-role'?: string;
    [key: string]: any;
  };
}


injectable()
export class ApplicationController {
  constructor(
    @inject(TYPES.IApplicationService) private applicationService: IApplicationService
  ) {}

  private handleError(res: Response, error: unknown, defaultMessage: string, statusCode = HttpStatusCode.BAD_REQUEST): void {
    console.error('Controller error:', error);
    
    if (error instanceof Error) {
      res.status(statusCode).json(buildErrorResponse(error.message));
      return;
    }
    
    res.status(statusCode).json(buildErrorResponse(defaultMessage));
  }

  private checkAuth(req: AuthRequest, res: Response, allowedRoles: string[]): boolean {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    
    if (!userId || !userRole || !allowedRoles.includes(userRole)) {
      res.status(HttpStatusCode.UNAUTHORIZED).json(
        buildErrorResponse('Unauthorized access')
      );
      return false;
    }
    return true;
  }

  private sendSuccess(res: Response, data: unknown, message: string, statusCode = HttpStatusCode.OK): void {
    res.status(statusCode).json(buildSuccessResponse(data, message));
  }

  async applyForJob(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 [ApplicationController] applyForJob called');
      console.log('🔍 [ApplicationController] Headers:', {
        'x-user-id': req.headers['x-user-id'],
        'x-user-email': req.headers['x-user-email'],
        'x-user-role': req.headers['x-user-role']
      });
      console.log('🔍 [ApplicationController] req.body:', req.body);
      console.log('🔍 [ApplicationController] req.file:', req.file);

      if (!this.checkAuth(req, res, ['jobseeker'])) return;
      const { jobId, companyId, coverLetter, expectedSalary, availability, experience } = req.body;
      const resumeFile = req.file as Express.Multer.File;
      if (!jobId || !companyId || !coverLetter || !expectedSalary || !availability || !experience) {
        return this.handleError(res, new Error('Missing required fields'), 'Missing required fields', HttpStatusCode.BAD_REQUEST);
      }

      let resumeUrl: string | undefined;

      if (resumeFile) {
        try {
          resumeUrl = await uploadToCloudinary(resumeFile.path, req.headers['x-user-id']!);
          console.log('✅ [ApplicationController] Resume uploaded to Cloudinary:', resumeUrl);
          
        } catch (uploadError) {
          console.log('🔄 [ApplicationController] Falling back to local file...');
          resumeUrl = `http://localhost:3004/uploads/${resumeFile.filename}`;
          console.log('📁 [ApplicationController] Using local file as fallback:', resumeUrl);
        }
      }
      const applicationData = {
        jobId,
        companyId,
        coverLetter,
        expectedSalary,
        availability,
        experience,
        resumeUrl,
        userId: req.headers['x-user-id']!
      };

      console.log('🔍 [ApplicationController] Application data:', {
        jobId,
        companyId,
        userId: req.headers['x-user-id']!,
        hasResume: !!resumeFile,
        resumeUrl: applicationData.resumeUrl
      });

      const result = await this.applicationService.applyForJob(applicationData);
      
      this.sendSuccess(res, result, 'Application submitted successfully', HttpStatusCode.CREATED);
    } catch (error: unknown) {
      console.error('❌ [ApplicationController] Application error:', error);
      this.handleError(res, error, 'Failed to submit application');
    }
  }

  async getUserApplications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res, ['jobseeker'])) return;

      const result = await this.applicationService.getUserApplications(req.headers['x-user-id']!);
      this.sendSuccess(res, result, 'Applications retrieved successfully');
    } catch (error: unknown) {
      this.handleError(res, error, 'Failed to retrieve applications', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async checkApplicationStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res, ['jobseeker'])) return;

      const { jobId } = req.params;
      const result = await this.applicationService.checkApplicationStatus(req.headers['x-user-id']!, jobId);
      this.sendSuccess(res, result, 'Application status checked successfully');
    } catch (error: unknown) {
      this.handleError(res, error, 'Failed to check application status', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getApplicationById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res, ['jobseeker', 'company'])) return;

      const { id } = req.params;
      const result = await this.applicationService.getApplicationById(id);
      
      if (req.headers['x-user-role'] === 'jobseeker' && result.userId !== req.headers['x-user-id']) {
        res.status(HttpStatusCode.FORBIDDEN).json(
          buildErrorResponse('You can only view your own applications')
        );
        return;
      }
      
      if (req.headers['x-user-role'] === 'company' && result.companyId !== req.headers['x-user-id']) {
        res.status(HttpStatusCode.FORBIDDEN).json(
          buildErrorResponse('You can only view applications for your jobs')
        );
        return;
      }

      this.sendSuccess(res, result, 'Application details retrieved successfully');
    } catch (error: unknown) {
      this.handleError(res, error, 'Application not found', HttpStatusCode.NOT_FOUND);
    }
  }

  async withdrawApplication(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res, ['jobseeker'])) return;

      const { id } = req.params;
      const result = await this.applicationService.withdrawApplication(id, req.headers['x-user-id']!);
      this.sendSuccess(res, result, 'Application withdrawn successfully');
    } catch (error: unknown) {
      this.handleError(res, error, 'Failed to withdraw application');
    }
  }

  async getCompanyApplications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res, ['company'])) return;

      const result = await this.applicationService.getCompanyApplications(req.headers['x-user-id']!);
      this.sendSuccess(res, result, 'Company applications retrieved successfully');
    } catch (error: unknown) {
      this.handleError(res, error, 'Failed to retrieve applications', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateApplicationStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res, ['company'])) return;

      const { id } = req.params;
      const validatedData = UpdateApplicationStatusSchema.parse(req.body);
      const result = await this.applicationService.updateApplicationStatus(id, validatedData, req.headers['x-user-id']!);
      
      this.sendSuccess(res, result, 'Application status updated successfully');
    } catch (error: unknown) {
      this.handleError(res, error, 'Failed to update application status');
    }
  }

  async addApplicationNote(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res, ['company'])) return;

      const { id } = req.params;
      const validatedData = AddApplicationNoteSchema.parse(req.body);
      const noteData = { ...validatedData, addedBy: req.headers['x-user-id']! };
      const result = await this.applicationService.addApplicationNote(id, noteData);
      
      this.sendSuccess(res, result, 'Note added successfully');
    } catch (error: unknown) {
      this.handleError(res, error, 'Failed to add note');
    }
  }

  async getApplicationDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res, ['company'])) return;

      const { id } = req.params;
      const result = await this.applicationService.getApplicationDetails(id, req.headers['x-user-id']!);
      this.sendSuccess(res, result, 'Application details retrieved successfully');
    } catch (error: unknown) {
      this.handleError(res, error, 'Application not found', HttpStatusCode.NOT_FOUND);
    }
  }


  async searchApplications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res, ['jobseeker', 'company'])) return;

      const filters = {
        companyId: req.headers['x-user-role'] === 'company' ? req.headers['x-user-id'] : req.query.companyId as string,
        userId: req.headers['x-user-role'] === 'jobseeker' ? req.headers['x-user-id'] : req.query.userId as string,
        status: req.query.status as string,
        jobId: req.query.jobId as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const result = await this.applicationService.searchApplications(filters);
      this.sendSuccess(res, result, 'Applications retrieved successfully');
    } catch (error: unknown) {
      this.handleError(res, error, 'Failed to search applications', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getCompanyApplicationStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res, ['company'])) return;

      const result = await this.applicationService.getCompanyApplicationStats(req.headers['x-user-id']!);
      this.sendSuccess(res, result, 'Statistics retrieved successfully');
    } catch (error: unknown) {
      this.handleError(res, error, 'Failed to retrieve statistics', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async bulkUpdateApplicationStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res, ['company'])) return;

      const { applicationIds, status } = req.body;
      
      if (!Array.isArray(applicationIds) || !status) {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse('Application IDs and status are required')
        );
        return;
      }

      await this.applicationService.bulkUpdateApplicationStatus(
        applicationIds, status, req.headers['x-user-id']!, req.headers['x-user-id']!
      );
      
      this.sendSuccess(res, null, 'Applications updated successfully');
    } catch (error: unknown) {
      this.handleError(res, error, 'Failed to update applications');
    }
  }
}