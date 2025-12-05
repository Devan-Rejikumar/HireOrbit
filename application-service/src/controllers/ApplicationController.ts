import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { IApplicationService } from "../services/interfaces/IApplicationService";
import { CreateApplicationSchema, UpdateApplicationStatusSchema,  AddApplicationNoteSchema,GetApplicationsQuerySchema } from "../dto/schemas/application.schema";
import { buildSuccessResponse } from 'shared-dto';
import { HttpStatusCode, ValidationStatusCode } from "../enums/StatusCodes";
import { TYPES } from '../config/types';
import { uploadToCloudinary } from '../config/cloudinary';
import { mapApplicationToResponse,mapUserApplicationsResponse} from '../dto/mappers/application.mapper';
import { AppError } from '../utils/errors/AppError';
import { Messages } from '../constants/Messages';
import { logger } from '../utils/logger';
import '../types/express';
@injectable()
export class ApplicationController {
  constructor(
    @inject(TYPES.IApplicationService) private _applicationService: IApplicationService
  ) {}

  async applyForJob(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || userRole !== 'jobseeker') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED
      );
    }

    const validationResult = CreateApplicationSchema.safeParse({
      ...req.body,
      userId
    });
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR
      );
    }

      const { jobId, companyId, coverLetter, expectedSalary, availability, experience, resumeBase64, resumeFileName, resumeUrl: resumeUrlFromBody } = validationResult.data;
      const resumeFile = req.file as Express.Multer.File;

    let resumeUrl: string | undefined;
    if (resumeUrlFromBody) {
      resumeUrl = resumeUrlFromBody;
    } else if (resumeBase64 && resumeFileName) {
      try {
        const fileBuffer = Buffer.from(resumeBase64, 'base64');
        const uploadPromise = uploadToCloudinary(fileBuffer, resumeFileName, userId);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout')), 10000)
        );
        
        resumeUrl = await Promise.race([uploadPromise, timeoutPromise]) as string;
      } catch (uploadError) {
        
        throw new AppError(Messages.RESUME.UPLOAD_FAILED, HttpStatusCode.BAD_REQUEST);
      }
    } else if (resumeFile) {
      try {
        
        const uploadPromise = uploadToCloudinary(resumeFile.buffer, resumeFile.originalname, userId);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout')), 10000)
        );
        
        resumeUrl = await Promise.race([uploadPromise, timeoutPromise]) as string;
        
      } catch (uploadError) {
        
        throw new AppError(Messages.RESUME.UPLOAD_FAILED, HttpStatusCode.BAD_REQUEST);
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

    const result = await this._applicationService.applyForJob(applicationData);
    
    const responseData = mapApplicationToResponse(result);
    
    res.status(HttpStatusCode.CREATED).json(
      buildSuccessResponse(responseData, Messages.APPLICATION.CREATED_SUCCESS)
    );
  }

  async getUserApplications(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || userRole !== 'jobseeker') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED
      );
    }

    const validationResult = GetApplicationsQuerySchema.safeParse(req.query);
    const page = validationResult.success ? (validationResult.data.page || 1) : 1;
    const limit = validationResult.success ? (validationResult.data.limit || 10) : 10;
    const status = validationResult.success ? validationResult.data.status : undefined;

    const result = await this._applicationService.getUserApplications(userId, page, limit, status);

    const responseData = mapUserApplicationsResponse(result.applications, result.total);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({
        ...responseData,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      }, Messages.APPLICATION.RETRIEVED_SUCCESS)
    );
  }

  async checkApplicationStatus(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || userRole !== 'jobseeker') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED
      );
    }
    const { jobId } = req.params;
    
    const result = await this._applicationService.checkApplicationStatus(userId, jobId);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, 'Application status checked successfully')
    );
  }

 
  async getApplicationById(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || !userRole) {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED
      );
    }

    const { id } = req.params;
    const result = await this._applicationService.getApplicationById(id);
    if (userRole === 'jobseeker' && result.userId !== userId) {
      throw new AppError('You can only view your own applications', HttpStatusCode.FORBIDDEN);
    }
    
    if (userRole === 'company' && result.companyId !== userId) {
      throw new AppError('You can only view applications for your jobs', HttpStatusCode.FORBIDDEN);
    }
    const responseData = mapApplicationToResponse(result);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(responseData, Messages.APPLICATION.RETRIEVED_SUCCESS)
    );
  }

  async withdrawApplication(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || userRole !== 'jobseeker') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED
      );
    }

    const { id } = req.params;
    
    const result = await this._applicationService.withdrawApplication(id, userId);
    const responseData = mapApplicationToResponse(result);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(responseData, Messages.APPLICATION.WITHDRAWN_SUCCESS)
    );
  }

  async getCompanyApplications(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED
      );
    }
    
    const result = await this._applicationService.getCompanyApplications(userId);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.APPLICATION.RETRIEVED_SUCCESS)
    );
  }

  async updateApplicationStatus(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED
      );
    }

    const { id } = req.params;
    const validationResult = UpdateApplicationStatusSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR
      );
    }
    
    const validatedData = validationResult.data;
    const result = await this._applicationService.updateApplicationStatus(id, validatedData, userId);
    const responseData = mapApplicationToResponse(result);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(responseData, Messages.APPLICATION.STATUS_UPDATED_SUCCESS)
    );
  }

  async addApplicationNote(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED
      );
    }

    const { id } = req.params;

    const validationResult = AddApplicationNoteSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR
      );
    }
    
    const validatedData = validationResult.data;
    const noteData = { ...validatedData, addedBy: userId };
    
    const result = await this._applicationService.addApplicationNote(id, noteData);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.APPLICATION.NOTE_ADDED_SUCCESS)
    );
  }

  async getApplicationDetails(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED
      );
    }

    const { id } = req.params;
    
    const result = await this._applicationService.getApplicationDetails(id, userId);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.APPLICATION.RETRIEVED_SUCCESS)
    );
  }

  async searchApplications(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || !userRole) {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED
      );
    }

    const validationResult = GetApplicationsQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR
      );
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

   

    const result = await this._applicationService.searchApplications(filters);

    const responseData = {
      applications: result.applications.map(app => mapApplicationToResponse(app)),
      pagination: result.pagination
    };
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(responseData, Messages.APPLICATION.SEARCH_SUCCESS)
    );
  }

  async getCompanyApplicationStats(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED
      );
    }
    
    const result = await this._applicationService.getCompanyApplicationStats(userId);

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
      buildSuccessResponse(responseData, Messages.APPLICATION.STATS_RETRIEVED_SUCCESS)
    );
  }

  async viewResume(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;
    
    if (!userId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED
      );
    }
    
    const { applicationId } = req.params;

    const application = await this._applicationService.getApplicationById(applicationId);
    
    if (application.companyId !== userId) {
      throw new AppError('Access denied', HttpStatusCode.FORBIDDEN);
    }
    
    if (!application.resumeUrl) {
      throw new AppError(Messages.RESUME.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    res.status(HttpStatusCode.OK).json({ 
      success: true,
      data: { resumeUrl: application.resumeUrl }
    });
  }

  async downloadResume(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;
    
    if (!userId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED
      );
    }
    const { applicationId } = req.params;

    const application = await this._applicationService.getApplicationById(applicationId);
    
    if (application.companyId !== userId) {
      throw new AppError('Access denied', HttpStatusCode.FORBIDDEN);
    }
    
    if (!application.resumeUrl) {
      throw new AppError(Messages.RESUME.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    const downloadUrl = application.resumeUrl.replace('/upload/', '/upload/fl_attachment/');
    res.redirect(downloadUrl);
  }

  async bulkUpdateApplicationStatus(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED
      );
    }

    const { applicationIds, status } = req.body;
    
    if (!Array.isArray(applicationIds) || !status) {
      throw new AppError(
        'Application IDs and status are required',
        HttpStatusCode.BAD_REQUEST
      );
    }

    await this._applicationService.bulkUpdateApplicationStatus(
      applicationIds, status, userId, userId
    );
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(null, Messages.APPLICATION.BULK_STATUS_UPDATED_SUCCESS)
    );
  }

  async getTopApplicants(req: Request, res: Response): Promise<void> {
    const limit = parseInt(req.query.limit as string) || 10;
    const applicants = await this._applicationService.getTopApplicantsByApplicationCount(limit);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ applicants }, 'Top applicants retrieved successfully')
    );
  }

  async getTopJobs(req: Request, res: Response): Promise<void> {
    const limit = parseInt(req.query.limit as string) || 10;
    const jobs = await this._applicationService.getTopJobsByApplicationCount(limit);
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ jobs }, 'Top jobs retrieved successfully')
    );
  }
}