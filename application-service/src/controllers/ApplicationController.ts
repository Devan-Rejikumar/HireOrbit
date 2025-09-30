// import { Request, Response } from "express";
// import { injectable, inject } from "inversify";
// import { ZodError } from "zod";
// import { IApplicationService } from "../services/IApplicationService";
// import { CreateApplicationSchema, UpdateApplicationStatusSchema, AddApplicationNoteSchema } from "../dto/schemas/application.schema";
// import { buildSuccessResponse, buildErrorResponse } from "../../../shared-dto/src";
// import { HttpStatusCode } from "../enums/StatusCodes";
// import { TYPES } from '../config/types';
// import { uploadToCloudinary } from '../config/cloudinary';

// // Define AuthRequest interface for header-based authentication
// interface AuthRequest extends Request {
//   headers: {
//     'x-user-id'?: string;
//     'x-user-email'?: string;
//     'x-user-role'?: string;
//     [key: string]: any;
//   };
// }


// injectable()
// export class ApplicationController {
//   constructor(
//     @inject(TYPES.IApplicationService) private applicationService: IApplicationService
//   ) {}

//   private handleError(res: Response, error: unknown, defaultMessage: string, statusCode = HttpStatusCode.BAD_REQUEST): void {
//     console.error('Controller error:', error);
    
//     if (error instanceof Error) {
//       res.status(statusCode).json(buildErrorResponse(error.message));
//       return;
//     }
    
//     res.status(statusCode).json(buildErrorResponse(defaultMessage));
//   }

//   private checkAuth(req: AuthRequest, res: Response, allowedRoles: string[]): boolean {
//     const userId = req.headers['x-user-id'];
//     const userRole = req.headers['x-user-role'];
    
//     if (!userId || !userRole || !allowedRoles.includes(userRole)) {
//       res.status(HttpStatusCode.UNAUTHORIZED).json(
//         buildErrorResponse('Unauthorized access')
//       );
//       return false;
//     }
//     return true;
//   }

//   private sendSuccess(res: Response, data: unknown, message: string, statusCode = HttpStatusCode.OK): void {
//     res.status(statusCode).json(buildSuccessResponse(data, message));
//   }

//   async applyForJob(req: AuthRequest, res: Response): Promise<void> {
//     try {
//       console.log('🔍 [ApplicationController] applyForJob called');
//       console.log('🔍 [ApplicationController] Headers:', {
//         'x-user-id': req.headers['x-user-id'],
//         'x-user-email': req.headers['x-user-email'],
//         'x-user-role': req.headers['x-user-role']
//       });
//       console.log('🔍 [ApplicationController] req.body:', req.body);
//       console.log('🔍 [ApplicationController] req.file:', req.file);

//       if (!this.checkAuth(req, res, ['jobseeker'])) return;
//       const { jobId, companyId, coverLetter, expectedSalary, availability, experience } = req.body;
//       const resumeFile = req.file as Express.Multer.File;
//       if (!jobId || !companyId || !coverLetter || !expectedSalary || !availability || !experience) {
//         return this.handleError(res, new Error('Missing required fields'), 'Missing required fields', HttpStatusCode.BAD_REQUEST);
//       }

//       let resumeUrl: string | undefined;

//       if (resumeFile) {
//         try {
//           resumeUrl = await uploadToCloudinary(resumeFile.path, req.headers['x-user-id']!);
//           console.log('✅ [ApplicationController] Resume uploaded to Cloudinary:', resumeUrl);
          
//         } catch (uploadError) {
//           console.log('🔄 [ApplicationController] Falling back to local file...');
//           resumeUrl = `http://localhost:3004/uploads/${resumeFile.filename}`;
//           console.log('📁 [ApplicationController] Using local file as fallback:', resumeUrl);
//         }
//       }
//       const applicationData = {
//         jobId,
//         companyId,
//         coverLetter,
//         expectedSalary,
//         availability,
//         experience,
//         resumeUrl,
//         userId: req.headers['x-user-id']!
//       };

//       console.log('🔍 [ApplicationController] Application data:', {
//         jobId,
//         companyId,
//         userId: req.headers['x-user-id']!,
//         hasResume: !!resumeFile,
//         resumeUrl: applicationData.resumeUrl
//       });

//       const result = await this.applicationService.applyForJob(applicationData);
      
//       this.sendSuccess(res, result, 'Application submitted successfully', HttpStatusCode.CREATED);
//     } catch (error: unknown) {
//       console.error('❌ [ApplicationController] Application error:', error);
//       this.handleError(res, error, 'Failed to submit application');
//     }
//   }

//   async getUserApplications(req: AuthRequest, res: Response): Promise<void> {
//     try {
//       if (!this.checkAuth(req, res, ['jobseeker'])) return;

//       const result = await this.applicationService.getUserApplications(req.headers['x-user-id']!);
//       this.sendSuccess(res, result, 'Applications retrieved successfully');
//     } catch (error: unknown) {
//       this.handleError(res, error, 'Failed to retrieve applications', HttpStatusCode.INTERNAL_SERVER_ERROR);
//     }
//   }

//   async checkApplicationStatus(req: AuthRequest, res: Response): Promise<void> {
//     try {
//       if (!this.checkAuth(req, res, ['jobseeker'])) return;

//       const { jobId } = req.params;
//       const result = await this.applicationService.checkApplicationStatus(req.headers['x-user-id']!, jobId);
//       this.sendSuccess(res, result, 'Application status checked successfully');
//     } catch (error: unknown) {
//       this.handleError(res, error, 'Failed to check application status', HttpStatusCode.INTERNAL_SERVER_ERROR);
//     }
//   }

//   async getApplicationById(req: AuthRequest, res: Response): Promise<void> {
//     try {
//       if (!this.checkAuth(req, res, ['jobseeker', 'company'])) return;

//       const { id } = req.params;
//       const result = await this.applicationService.getApplicationById(id);
      
//       if (req.headers['x-user-role'] === 'jobseeker' && result.userId !== req.headers['x-user-id']) {
//         res.status(HttpStatusCode.FORBIDDEN).json(
//           buildErrorResponse('You can only view your own applications')
//         );
//         return;
//       }
      
//       if (req.headers['x-user-role'] === 'company' && result.companyId !== req.headers['x-user-id']) {
//         res.status(HttpStatusCode.FORBIDDEN).json(
//           buildErrorResponse('You can only view applications for your jobs')
//         );
//         return;
//       }

//       this.sendSuccess(res, result, 'Application details retrieved successfully');
//     } catch (error: unknown) {
//       this.handleError(res, error, 'Application not found', HttpStatusCode.NOT_FOUND);
//     }
//   }

//   async withdrawApplication(req: AuthRequest, res: Response): Promise<void> {
//     try {
//       if (!this.checkAuth(req, res, ['jobseeker'])) return;

//       const { id } = req.params;
//       const result = await this.applicationService.withdrawApplication(id, req.headers['x-user-id']!);
//       this.sendSuccess(res, result, 'Application withdrawn successfully');
//     } catch (error: unknown) {
//       this.handleError(res, error, 'Failed to withdraw application');
//     }
//   }

//   async getCompanyApplications(req: AuthRequest, res: Response): Promise<void> {
//     try {
//       if (!this.checkAuth(req, res, ['company'])) return;

//       const result = await this.applicationService.getCompanyApplications(req.headers['x-user-id']!);
//       this.sendSuccess(res, result, 'Company applications retrieved successfully');
//     } catch (error: unknown) {
//       this.handleError(res, error, 'Failed to retrieve applications', HttpStatusCode.INTERNAL_SERVER_ERROR);
//     }
//   }

//   async updateApplicationStatus(req: AuthRequest, res: Response): Promise<void> {
//     try {
//       if (!this.checkAuth(req, res, ['company'])) return;

//       const { id } = req.params;
//       const validatedData = UpdateApplicationStatusSchema.parse(req.body);
//       const result = await this.applicationService.updateApplicationStatus(id, validatedData, req.headers['x-user-id']!);
      
//       this.sendSuccess(res, result, 'Application status updated successfully');
//     } catch (error: unknown) {
//       this.handleError(res, error, 'Failed to update application status');
//     }
//   }

//   async addApplicationNote(req: AuthRequest, res: Response): Promise<void> {
//     try {
//       if (!this.checkAuth(req, res, ['company'])) return;

//       const { id } = req.params;
//       const validatedData = AddApplicationNoteSchema.parse(req.body);
//       const noteData = { ...validatedData, addedBy: req.headers['x-user-id']! };
//       const result = await this.applicationService.addApplicationNote(id, noteData);
      
//       this.sendSuccess(res, result, 'Note added successfully');
//     } catch (error: unknown) {
//       this.handleError(res, error, 'Failed to add note');
//     }
//   }

//   async getApplicationDetails(req: AuthRequest, res: Response): Promise<void> {
//     try {
//       if (!this.checkAuth(req, res, ['company'])) return;

//       const { id } = req.params;
//       const result = await this.applicationService.getApplicationDetails(id, req.headers['x-user-id']!);
//       this.sendSuccess(res, result, 'Application details retrieved successfully');
//     } catch (error: unknown) {
//       this.handleError(res, error, 'Application not found', HttpStatusCode.NOT_FOUND);
//     }
//   }


//   async searchApplications(req: AuthRequest, res: Response): Promise<void> {
//     try {
//       if (!this.checkAuth(req, res, ['jobseeker', 'company'])) return;

//       const filters = {
//         companyId: req.headers['x-user-role'] === 'company' ? req.headers['x-user-id'] : req.query.companyId as string,
//         userId: req.headers['x-user-role'] === 'jobseeker' ? req.headers['x-user-id'] : req.query.userId as string,
//         status: req.query.status as string,
//         jobId: req.query.jobId as string,
//         page: req.query.page ? parseInt(req.query.page as string) : 1,
//         limit: req.query.limit ? parseInt(req.query.limit as string) : 10
//       };

//       const result = await this.applicationService.searchApplications(filters);
//       this.sendSuccess(res, result, 'Applications retrieved successfully');
//     } catch (error: unknown) {
//       this.handleError(res, error, 'Failed to search applications', HttpStatusCode.INTERNAL_SERVER_ERROR);
//     }
//   }

//   async getCompanyApplicationStats(req: AuthRequest, res: Response): Promise<void> {
//     try {
//       if (!this.checkAuth(req, res, ['company'])) return;

//       const result = await this.applicationService.getCompanyApplicationStats(req.headers['x-user-id']!);
//       this.sendSuccess(res, result, 'Statistics retrieved successfully');
//     } catch (error: unknown) {
//       this.handleError(res, error, 'Failed to retrieve statistics', HttpStatusCode.INTERNAL_SERVER_ERROR);
//     }
//   }

//   async bulkUpdateApplicationStatus(req: AuthRequest, res: Response): Promise<void> {
//     try {
//       if (!this.checkAuth(req, res, ['company'])) return;

//       const { applicationIds, status } = req.body;
      
//       if (!Array.isArray(applicationIds) || !status) {
//         res.status(HttpStatusCode.BAD_REQUEST).json(
//           buildErrorResponse('Application IDs and status are required')
//         );
//         return;
//       }

//       await this.applicationService.bulkUpdateApplicationStatus(
//         applicationIds, status, req.headers['x-user-id']!, req.headers['x-user-id']!
//       );
      
//       this.sendSuccess(res, null, 'Applications updated successfully');
//     } catch (error: unknown) {
//       this.handleError(res, error, 'Failed to update applications');
//     }
//   }

  
  
// }

import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { ZodError } from "zod";
import { IApplicationService } from "../services/IApplicationService";
import { 
  CreateApplicationSchema, 
  UpdateApplicationStatusSchema, 
  AddApplicationNoteSchema,
  GetApplicationsQuerySchema 
} from "../dto/schemas/application.schema";
import { buildSuccessResponse, buildErrorResponse } from "../../../shared-dto/src";
import { HttpStatusCode, ValidationStatusCode } from "../enums/StatusCodes";
import { TYPES } from '../config/types';
import { uploadToCloudinary } from '../config/cloudinary';
import { 
  mapApplicationToResponse,
  mapUserApplicationsResponse,
  mapCompanyApplicationsResponse,
  mapApplicationToDetailsResponse
} from '../dto/mappers/application.mapper';

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

  // 1. Apply for a job (Job Seekers)
  async applyForJob(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [ApplicationController] applyForJob called');
      console.log('🔍 [ApplicationController] req.user:', req.user);
      console.log('🔍 [ApplicationController] Headers (fallback):', {
        'x-user-id': req.headers['x-user-id'],
        'x-user-email': req.headers['x-user-email'],
        'x-user-role': req.headers['x-user-role']
      });
      console.log('🔍 [ApplicationController] req.body:', req.body);
      console.log('🔍 [ApplicationController] req.file:', req.file);

      // Use req.user (preferred method) or fallback to headers
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'jobseeker') {
        console.log('❌ [ApplicationController] Unauthorized access');
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      // Validate request body with userId from headers
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

      const { jobId, companyId, coverLetter, expectedSalary, availability, experience } = validationResult.data;
      const resumeFile = req.file as Express.Multer.File;

      let resumeUrl: string | undefined;

      if (resumeFile) {
        try {
          resumeUrl = await uploadToCloudinary(resumeFile.path, userId);
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
        userId
      };

      console.log('🔍 [ApplicationController] Application data:', {
        jobId,
        companyId,
        userId,
        hasResume: !!resumeFile,
        resumeUrl: applicationData.resumeUrl
      });

      const result = await this.applicationService.applyForJob(applicationData);
      
      // Map to response DTO
      const responseData = mapApplicationToResponse(result);
      
      res.status(HttpStatusCode.CREATED).json(
        buildSuccessResponse(responseData, 'Application submitted successfully')
      );
    } catch (error: unknown) {
      console.error('❌ [ApplicationController] Application error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Failed to submit application')
      );
    }
  }

  // 2. Get user's applications (Job Seekers)
  async getUserApplications(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [ApplicationController] getUserApplications called');
      console.log('🔍 [ApplicationController] req.user:', req.user);

      // Use req.user (preferred method) or fallback to headers
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'jobseeker') {
        console.log('❌ [ApplicationController] Unauthorized access');
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      const result = await this.applicationService.getUserApplications(userId);
      
      // Map to response DTO
      const responseData = mapUserApplicationsResponse(result.applications, result.total);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(responseData, 'Applications retrieved successfully')
      );
    } catch (error: unknown) {
      console.error('❌ [ApplicationController] Error in getUserApplications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to retrieve applications')
      );
    }
  }

  // 3. Check application status for a specific job (Job Seekers)
  async checkApplicationStatus(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [ApplicationController] checkApplicationStatus called');
      console.log('🔍 [ApplicationController] req.user:', req.user);

      // Use req.user (preferred method) or fallback to headers
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'jobseeker') {
        console.log('❌ [ApplicationController] Unauthorized access');
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      const { jobId } = req.params;
      console.log(`🔍 [ApplicationController] Checking application status for userId: ${userId}, jobId: ${jobId}`);
      
      const result = await this.applicationService.checkApplicationStatus(userId, jobId);
      console.log(`🔍 [ApplicationController] Application status result:`, result);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Application status checked successfully')
      );
    } catch (error: unknown) {
      console.error('❌ [ApplicationController] Error in checkApplicationStatus:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to check application status')
      );
    }
  }

  // 4. Get application by ID (Job Seekers & Companies)
  async getApplicationById(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [ApplicationController] getApplicationById called');
      console.log('🔍 [ApplicationController] req.user:', req.user);

      // Use req.user (preferred method) or fallback to headers
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || !userRole) {
        console.log('❌ [ApplicationController] Unauthorized access');
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      const { id } = req.params;
      const result = await this.applicationService.getApplicationById(id);
      
      // Authorization checks
      if (userRole === 'jobseeker' && result.userId !== userId) {
        res.status(403).json({ error: 'You can only view your own applications' });
        return;
      }
      
      if (userRole === 'company' && result.companyId !== userId) {
        res.status(403).json({ error: 'You can only view applications for your jobs' });
        return;
      }

      // Map to response DTO
      const responseData = mapApplicationToResponse(result);

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(responseData, 'Application details retrieved successfully')
      );
    } catch (error: unknown) {
      console.error('❌ [ApplicationController] Error in getApplicationById:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.NOT_FOUND).json(
        buildErrorResponse(errorMessage, 'Application not found')
      );
    }
  }

  // 5. Withdraw application (Job Seekers)
  async withdrawApplication(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [ApplicationController] withdrawApplication called');
      console.log('🔍 [ApplicationController] req.user:', req.user);

      // Use req.user (preferred method) or fallback to headers
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'jobseeker') {
        console.log('❌ [ApplicationController] Unauthorized access');
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      const { id } = req.params;
      console.log(`🔍 [ApplicationController] Withdrawing application ${id} for user ${userId}`);
      
      const result = await this.applicationService.withdrawApplication(id, userId);
      
      // Map to response DTO
      const responseData = mapApplicationToResponse(result);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(responseData, 'Application withdrawn successfully')
      );
    } catch (error: unknown) {
      console.error('❌ [ApplicationController] Error in withdrawApplication:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Failed to withdraw application')
      );
    }
  }

  // 6. Get company's applications (Companies)
  async getCompanyApplications(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [ApplicationController] getCompanyApplications called');
      console.log('🔍 [ApplicationController] req.user:', req.user);

      // Use req.user (preferred method) or fallback to headers
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'company') {
        console.log('❌ [ApplicationController] Unauthorized access');
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      console.log(`🔍 [ApplicationController] Getting applications for company ${userId}`);
      
      const result = await this.applicationService.getCompanyApplications(userId);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Company applications retrieved successfully')
      );
    } catch (error: unknown) {
      console.error('❌ [ApplicationController] Error in getCompanyApplications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to retrieve applications')
      );
    }
  }

  // 7. Update application status (Companies)
  async updateApplicationStatus(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [ApplicationController] updateApplicationStatus called');
      console.log('🔍 [ApplicationController] req.user:', req.user);

      // Use req.user (preferred method) or fallback to headers
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'company') {
        console.log('❌ [ApplicationController] Unauthorized access');
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      const { id } = req.params;
      
      // Validate request body
      const validationResult = UpdateApplicationStatusSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
      
      const validatedData = validationResult.data;
      
      console.log(`🔍 [ApplicationController] Updating application ${id} status to ${validatedData.status} by company ${userId}`);
      
      const result = await this.applicationService.updateApplicationStatus(id, validatedData, userId);
      
      // Map to response DTO
      const responseData = mapApplicationToResponse(result);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(responseData, 'Application status updated successfully')
      );
    } catch (error: unknown) {
      console.error('❌ [ApplicationController] Error in updateApplicationStatus:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Failed to update application status')
      );
    }
  }

  // 8. Add note to application (Companies)
  async addApplicationNote(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [ApplicationController] addApplicationNote called');
      console.log('🔍 [ApplicationController] req.user:', req.user);

      // Use req.user (preferred method) or fallback to headers
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'company') {
        console.log('❌ [ApplicationController] Unauthorized access');
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      const { id } = req.params;
      
      // Validate request body
      const validationResult = AddApplicationNoteSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
      
      const validatedData = validationResult.data;
      const noteData = { ...validatedData, addedBy: userId };
      
      console.log(`🔍 [ApplicationController] Adding note to application ${id}`);
      
      const result = await this.applicationService.addApplicationNote(id, noteData);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Note added successfully')
      );
    } catch (error: unknown) {
      console.error('❌ [ApplicationController] Error in addApplicationNote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Failed to add note')
      );
    }
  }

  // 9. Get detailed application info (Companies)
  async getApplicationDetails(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [ApplicationController] getApplicationDetails called');
      console.log('🔍 [ApplicationController] req.user:', req.user);

      // Use req.user (preferred method) or fallback to headers
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'company') {
        console.log('❌ [ApplicationController] Unauthorized access');
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      const { id } = req.params;
      
      console.log(`🔍 [ApplicationController] Getting details for application ${id} by company ${userId}`);
      
      const result = await this.applicationService.getApplicationDetails(id, userId);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Application details retrieved successfully')
      );
    } catch (error: unknown) {
      console.error('❌ [ApplicationController] Error in getApplicationDetails:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.NOT_FOUND).json(
        buildErrorResponse(errorMessage, 'Application not found')
      );
    }
  }

  // 10. Search applications (Job Seekers & Companies)
  async searchApplications(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [ApplicationController] searchApplications called');
      console.log('🔍 [ApplicationController] req.user:', req.user);

      // Use req.user (preferred method) or fallback to headers
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || !userRole) {
        console.log('❌ [ApplicationController] Unauthorized access');
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      // Validate query parameters
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
      
      // Map to response DTO
      const responseData = {
        applications: result.applications.map(app => mapApplicationToResponse(app)),
        pagination: result.pagination
      };
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(responseData, 'Applications retrieved successfully')
      );
    } catch (error: unknown) {
      console.error('❌ [ApplicationController] Error in searchApplications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to search applications')
      );
    }
  }

  // 11. Get company application statistics (Companies)
  async getCompanyApplicationStats(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [ApplicationController] getCompanyApplicationStats called');
      console.log('🔍 [ApplicationController] req.user:', req.user);

      // Use req.user (preferred method) or fallback to headers
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'company') {
        console.log('❌ [ApplicationController] Unauthorized access');
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      console.log(`🔍 [ApplicationController] Getting stats for company ${userId}`);
      
      const result = await this.applicationService.getCompanyApplicationStats(userId);
      
      // Map to response DTO
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
      console.error('❌ [ApplicationController] Error in getCompanyApplicationStats:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to retrieve statistics')
      );
    }
  }

  // 12. Bulk update application status (Companies)
  async bulkUpdateApplicationStatus(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [ApplicationController] bulkUpdateApplicationStatus called');
      console.log('🔍 [ApplicationController] req.user:', req.user);

      // Use req.user (preferred method) or fallback to headers
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'company') {
        console.log('❌ [ApplicationController] Unauthorized access');
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

      console.log(`🔍 [ApplicationController] Bulk updating ${applicationIds.length} applications to ${status} by company ${userId}`);

      await this.applicationService.bulkUpdateApplicationStatus(
        applicationIds, status, userId, userId
      );
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(null, 'Applications updated successfully')
      );
    } catch (error: unknown) {
      console.error('❌ [ApplicationController] Error in bulkUpdateApplicationStatus:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Failed to update applications')
      );
    }
  }
}