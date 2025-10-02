
import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { IApplicationService } from "../services/IApplicationService";
import { CreateApplicationSchema, UpdateApplicationStatusSchema,  AddApplicationNoteSchema,GetApplicationsQuerySchema } from "../dto/schemas/application.schema";
import { buildSuccessResponse, buildErrorResponse } from "../../../shared-dto/src";
import { HttpStatusCode, ValidationStatusCode } from "../enums/StatusCodes";
import { TYPES } from '../config/types';
import { uploadToCloudinary } from '../config/cloudinary';
import { mapApplicationToResponse,mapUserApplicationsResponse} from '../dto/mappers/application.mapper';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        isActive?: boolean;
        createdAt?: string;
        updatedAt?: string;
      };
    }
  }
}
@injectable()
export class ApplicationController {
  constructor(
    @inject(TYPES.IApplicationService) private applicationService: IApplicationService
  ) {}

  async applyForJob(req: Request, res: Response): Promise<void> {
    try {
      console.log('ApplicationController applyForJob called');

      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'jobseeker') {
        console.log('ApplicationController Unauthorized access');
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      const validationResult = CreateApplicationSchema.safeParse({
        ...req.body,
        userId
      });
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }

      const { jobId, companyId, coverLetter, expectedSalary, availability, experience, resumeBase64, resumeFileName } = validationResult.data;
      const resumeFile = req.file as Express.Multer.File;

      let resumeUrl: string | undefined;
      if (resumeBase64 && resumeFileName) {
        try {
          console.log('ApplicationController Starting Cloudinary upload from base64...');
          const fileBuffer = Buffer.from(resumeBase64, 'base64');
          const uploadPromise = uploadToCloudinary(fileBuffer, resumeFileName, userId);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout')), 10000)
          );
          
          resumeUrl = await Promise.race([uploadPromise, timeoutPromise]) as string;
          console.log('ApplicationController Resume uploaded to Cloudinary:', resumeUrl);
        } catch (uploadError) {
          console.log('ApplicationController Cloudinary upload failed:', uploadError);
          throw new Error('Failed to upload resume to cloud storage. Please try again.');
        }
      } else if (resumeFile) {
        try {
          console.log('ApplicationController Starting Cloudinary upload from multipart...');
          const uploadPromise = uploadToCloudinary(resumeFile.buffer, resumeFile.originalname, userId);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout')), 10000)
          );
          
          resumeUrl = await Promise.race([uploadPromise, timeoutPromise]) as string;
          console.log('ApplicationController Resume uploaded to Cloudinary:', resumeUrl);
        } catch (uploadError) {
          console.log('ApplicationController Cloudinary upload failed:', uploadError);
          throw new Error('Failed to upload resume to cloud storage. Please try again.');
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
        userId
      };

      const result = await this.applicationService.applyForJob(applicationData);
      
      console.log('ApplicationController Application created:', {
        id: result.id,
        userId: result.userId,
        companyId: result.companyId,
        jobId: result.jobId,
        status: result.status
      });
 
      const responseData = mapApplicationToResponse(result);
      
      res.status(HttpStatusCode.CREATED).json(
        buildSuccessResponse(responseData, 'Application submitted successfully')
      );
    } catch (error: unknown) {
      console.error('ApplicationController Application error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Failed to submit application')
      );
    }
  }

  async getUserApplications(req: Request, res: Response): Promise<void> {
    try {

      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'jobseeker') {
        console.log('ApplicationController Unauthorized access');
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      const result = await this.applicationService.getUserApplications(userId);

      const responseData = mapUserApplicationsResponse(result.applications, result.total);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(responseData, 'Applications retrieved successfully')
      );
    } catch (error: unknown) {
      console.error('ApplicationController Error in getUserApplications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to retrieve applications')
      );
    }
  }

  async checkApplicationStatus(req: Request, res: Response): Promise<void> {
    try {
      console.log('ApplicationController checkApplicationStatus called');
      console.log('ApplicationController req.user:', req.user);
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'jobseeker') {
        console.log('ApplicationController Unauthorized access');
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }
      const { jobId } = req.params;
      
      const result = await this.applicationService.checkApplicationStatus(userId, jobId);
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Application status checked successfully')
      );
    } catch (error: unknown) {
      console.error('ApplicationController Error in checkApplicationStatus:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to check application status')
      );
    }
  }

 
  async getApplicationById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || !userRole) {
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      const { id } = req.params;
      const result = await this.applicationService.getApplicationById(id);
      if (userRole === 'jobseeker' && result.userId !== userId) {
        res.status(403).json({ error: 'You can only view your own applications' });
        return;
      }
      
      if (userRole === 'company' && result.companyId !== userId) {
        res.status(403).json({ error: 'You can only view applications for your jobs' });
        return;
      }
      const responseData = mapApplicationToResponse(result);

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(responseData, 'Application details retrieved successfully')
      );
    } catch (error: unknown) {
      console.error('ApplicationController Error in getApplicationById:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.NOT_FOUND).json(
        buildErrorResponse(errorMessage, 'Application not found')
      );
    }
  }

  async withdrawApplication(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'jobseeker') {
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      const { id } = req.params;
      
      const result = await this.applicationService.withdrawApplication(id, userId);
      const responseData = mapApplicationToResponse(result);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(responseData, 'Application withdrawn successfully')
      );
    } catch (error: unknown) {
      console.error('ApplicationController Error in withdrawApplication:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Failed to withdraw application')
      );
    }
  }

  async getCompanyApplications(req: Request, res: Response): Promise<void> {
    try {

      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'company') {
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }
      
      const result = await this.applicationService.getCompanyApplications(userId);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Company applications retrieved successfully')
      );
    } catch (error: unknown) {
      console.error('ApplicationController Error in getCompanyApplications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to retrieve applications')
      );
    }
  }

  async updateApplicationStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'company') {
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      const { id } = req.params;
      const validationResult = UpdateApplicationStatusSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log('ApplicationControllerValidation failed:', validationResult.error);
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
      
      const validatedData = validationResult.data;
      console.log('ApplicationController Validation passed, data:', validatedData);
      const result = await this.applicationService.updateApplicationStatus(id, validatedData, userId);
      const responseData = mapApplicationToResponse(result);
  
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(responseData, 'Application status updated successfully')
      );
      console.log('ApplicationController Response sent successfully!');
      
    } catch (error: unknown) {
      console.error('ApplicationController CAUGHT ERROR:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('ApplicationController Error message:', errorMessage);
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Failed to update application status')
      );
    }
  }

  async addApplicationNote(req: Request, res: Response): Promise<void> {
    try {

      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'company') {
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      const { id } = req.params;

      const validationResult = AddApplicationNoteSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
      
      const validatedData = validationResult.data;
      const noteData = { ...validatedData, addedBy: userId };
      
      
      const result = await this.applicationService.addApplicationNote(id, noteData);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Note added successfully')
      );
    } catch (error: unknown) {
      console.error('ApplicationController Error in addApplicationNote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Failed to add note')
      );
    }
  }

  async getApplicationDetails(req: Request, res: Response): Promise<void> {
    try {

      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'company') {
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      const { id } = req.params;
      
      
      const result = await this.applicationService.getApplicationDetails(id, userId);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Application details retrieved successfully')
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.NOT_FOUND).json(
        buildErrorResponse(errorMessage, 'Application not found')
      );
    }
  }

  async searchApplications(req: Request, res: Response): Promise<void> {
    try {

      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || !userRole) {
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      const validationResult = GetApplicationsQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }

      const validatedQuery = validationResult.data;
      const filters = {
        companyId: userRole === 'company' ? userId : validatedQuery.companyId,
        userId: userRole === 'jobseeker' ? userId : validatedQuery.userId,
        status: validatedQuery.status,
        jobId: validatedQuery.jobId,
        page: validatedQuery.page || 1,
        limit: validatedQuery.limit || 10
      };

      console.log(`🔍 [ApplicationController] Searching applications with filters:`, filters);

      const result = await this.applicationService.searchApplications(filters);

      const responseData = {
        applications: result.applications.map(app => mapApplicationToResponse(app)),
        pagination: result.pagination
      };
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(responseData, 'Applications retrieved successfully')
      );
    } catch (error: unknown) {
      console.error('ApplicationController Error in searchApplications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to search applications')
      );
    }
  }

  async getCompanyApplicationStats(req: Request, res: Response): Promise<void> {
    try {

      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'company') {
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }
      
      const result = await this.applicationService.getCompanyApplicationStats(userId);

      const responseData = {
        total: result.total,
        pending: result.pending,
        reviewing: result.reviewing,
        shortlisted: result.shortlisted,
        rejected: result.rejected,
        accepted: result.accepted,
        withdrawn: result.withdrawn
      };
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(responseData, 'Statistics retrieved successfully')
      );
    } catch (error: unknown) {
      console.error('ApplicationController Error in getCompanyApplicationStats:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to retrieve statistics')
      );
    }
  }

  async viewResume(req: Request, res: Response): Promise<void> {
    try {
      console.log('👁️ [ApplicationController] viewResume called');
      
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;
      
      if (!userId || userRole !== 'company') {
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }
      
      const { applicationId } = req.params;

      const application = await this.applicationService.getApplicationById(applicationId);
      
      if (application.companyId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
      
      if (!application.resumeUrl) {
        res.status(404).json({ error: 'No resume uploaded for this application' });
        return;
      }

      res.status(200).json({ 
        success: true,
        data: { resumeUrl: application.resumeUrl }
      });
      
    } catch (error) {
      console.error('ApplicationController Error viewing resume:', error);
      res.status(500).json({ error: 'Failed to view resume' });
    }
  }

  async downloadResume(req: Request, res: Response): Promise<void> {
    try {
      console.log('ApplicationController downloadResume called');
      
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;
      
      if (!userId || userRole !== 'company') {
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }
      const { applicationId } = req.params;

      const application = await this.applicationService.getApplicationById(applicationId);
      
      if (application.companyId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
      
      if (!application.resumeUrl) {
        res.status(404).json({ error: 'No resume uploaded for this application' });
        return;
      }

      const downloadUrl = application.resumeUrl.replace('/upload/', '/upload/fl_attachment/');
      res.redirect(downloadUrl);
      
    } catch (error) {
      console.error('ApplicationController Error downloading resume:', error);
      res.status(500).json({ error: 'Failed to download resume' });
    }
  }

  async bulkUpdateApplicationStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'company') {
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      const { applicationIds, status } = req.body;
      
      if (!Array.isArray(applicationIds) || !status) {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse('Application IDs and status are required')
        );
        return;
      }

      

      await this.applicationService.bulkUpdateApplicationStatus(
        applicationIds, status, userId, userId
      );
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(null, 'Applications updated successfully')
      );
    } catch (error: unknown) {
      console.error('ApplicationController Error in bulkUpdateApplicationStatus:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Failed to update applications')
      );
    }
  }
}