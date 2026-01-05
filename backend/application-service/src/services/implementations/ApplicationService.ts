import { injectable, inject } from 'inversify';
import { ApplicationStatus } from '../../enums/ApplicationStatus';
import { IApplicationService } from '../interfaces/IApplicationService';
import { IApplicationRepository } from '../../repositories/interfaces/IApplicationRepository';
import { IEventService } from '../interfaces/IEventService';
import { StatusUpdateService } from './StatusUpdateService';
import { 
  ApplicationResponse, 
  ApplicationDetailsResponse,
  CompanyApplicationsResponse,
  UserApplicationsResponse, 
} from '../../dto/responses/application.response';
import { 
  CreateApplicationInput, 
  UpdateApplicationStatusInput, 
  AddApplicationNoteInput, 
} from '../../dto/schemas/application.schema';
import {
  mapApplicationToResponse,
  mapApplicationToDetailsResponse,
  mapUserApplicationsResponse,
  mapCompanyApplicationsResponse,
  mapPaginatedApplicationsResponse,
  calculateApplicationStats,
} from '../../dto/mappers/application.mapper';
import { TYPES } from '../../config/types';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errors/AppError';
import { Messages } from '../../constants/Messages';
import { Events } from '../../constants/Events';
import { HttpStatusCode } from '../../enums/StatusCodes';
import { IUserServiceClient } from '../interfaces/IUserServiceClient';
import { IJobServiceClient } from '../interfaces/IJobServiceClient';
import { IATSService } from '../interfaces/IATSService';
import axios from 'axios';
import { Application } from '@prisma/client';

@injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @inject(TYPES.IApplicationRepository) private _applicationRepository: IApplicationRepository,
    @inject(TYPES.IEventService) private _eventService: IEventService,
    @inject(TYPES.StatusUpdateService) private _statusUpdateService: StatusUpdateService,
    @inject(TYPES.IUserServiceClient) private _userServiceClient: IUserServiceClient,
    @inject(TYPES.IJobServiceClient) private _jobServiceClient: IJobServiceClient,
    @inject(TYPES.GrokATSService) private _atsService: IATSService,
    @inject(TYPES.ResumeParserService) private _resumeParser: IATSService,
  ) {}

  async applyForJob(data: CreateApplicationInput, resumeBuffer?: Buffer, resumeMimeType?: string): Promise<ApplicationResponse> {
    const eligibility = await this.validateApplicationEligibility(data.userId, data.jobId);
    if (!eligibility.eligible) {
      throw new AppError(eligibility.reason || Messages.APPLICATION.NOT_ELIGIBLE, HttpStatusCode.BAD_REQUEST);
    }

    const application = await this._applicationRepository.create(data);
    this.calculateAndStoreATSScore(application.id, data.jobId, data.resumeUrl, resumeBuffer, resumeMimeType).catch(error => {
      logger.error('Failed to calculate ATS score for application:', {
        applicationId: application.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });
    
    try {
      await this._eventService.publish(Events.APPLICATION.CREATED, {
        applicationId: application.id,
        userId: application.userId,
        jobId: application.jobId,
        companyId: application.companyId,
      });
    } catch (error) {
      logger.warn('Kafka not available, continuing...', error);
    }

    return mapApplicationToResponse(application);
  }

  /**
   * Calculate ATS score and update application
   * This runs asynchronously after application creation
   */
  private async calculateAndStoreATSScore(
    applicationId: string,
    jobId: string,
    resumeUrl: string | undefined,
    resumeBuffer: Buffer | undefined,
    resumeMimeType: string | undefined,
  ): Promise<void> {
    try {
      logger.info('Starting ATS score calculation', {
        applicationId,
        jobId,
        hasResumeUrl: !!resumeUrl,
        hasResumeBuffer: !!resumeBuffer,
        resumeMimeType: resumeMimeType || 'none',
      });

      logger.info('Fetching job description', { jobId });
      const jobData = await this._jobServiceClient.getJobById(jobId);
      logger.info('Job data fetched', { 
        jobId,
        hasData: !!jobData.data,
        hasJob: !!jobData.data?.job,
        hasDescription: !!(jobData.data?.job?.description || jobData.job?.description),
      });
      
      const jobDescriptionRaw = jobData.data?.job?.description || jobData.job?.description;
      const jobDescription = typeof jobDescriptionRaw === 'string' ? jobDescriptionRaw : String(jobDescriptionRaw || '');
      
      if (!jobDescription || jobDescription.trim().length === 0) {
        logger.warn('Job description not found or invalid, skipping ATS score calculation', { 
          jobId, 
          applicationId,
          jobDescriptionLength: jobDescription.length,
        });
        return;
      }

      logger.info('Job description retrieved', {
        jobId,
        descriptionLength: jobDescription.length,
      });
      let resumeText: string;
      
      if (resumeBuffer && resumeMimeType) {
        logger.info('Parsing resume from buffer', {
          applicationId,
          bufferSize: resumeBuffer.length,
          mimeType: resumeMimeType,
        });
        try {
          const parseResult = await this._resumeParser.parseResume(resumeBuffer, resumeMimeType);
          resumeText = parseResult.text;
          logger.info('Resume parsed from buffer', {
            applicationId,
            textLength: resumeText.length,
          });
        } catch (parseError) {
          logger.error('Failed to parse resume from buffer:', {
            applicationId,
            bufferSize: resumeBuffer.length,
            mimeType: resumeMimeType,
            error: parseError instanceof Error ? parseError.message : String(parseError),
            errorStack: parseError instanceof Error ? parseError.stack : undefined,
            errorType: parseError?.constructor?.name,
          });
          return;
        }
      } else if (resumeUrl) {
        logger.info('Fetching resume from Cloudinary URL', {
          applicationId,
          resumeUrl,
        });
        try {
          const response = await axios.get(resumeUrl, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(response.data);
          const mimeType = response.headers['content-type'] || 'application/pdf';
          logger.info('Resume fetched from URL', {
            applicationId,
            bufferSize: buffer.length,
            mimeType,
          });
   
          const parseResult = await this._resumeParser.parseResume(buffer, mimeType);
          resumeText = parseResult.text;
          logger.info('Resume parsed from URL', {
            applicationId,
            textLength: resumeText.length,
          });
        } catch (error) {
          logger.error('Failed to fetch resume from URL for ATS calculation:', {
            resumeUrl,
            applicationId,
            error: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
            errorType: error?.constructor?.name,
          });
          return;
        }
      } else {
        logger.warn('No resume available for ATS score calculation', { 
          applicationId,
          hasResumeUrl: !!resumeUrl,
          hasResumeBuffer: !!resumeBuffer,
        });
        return;
      }
      logger.info('Calculating ATS score with GROQ', {
        applicationId,
        resumeTextLength: resumeText.length,
        jobDescriptionLength: jobDescription.length,
      });
      
      const atsscore = await this._atsService.calculateATSScore(resumeText, jobDescription);
      
      logger.info('ATS score calculated', {
        applicationId,
        atsscore,
      });
      
      await this._applicationRepository.update(applicationId, { atsscore } as Partial<Application>);
      
      logger.info('ATS score calculated and stored successfully', {
        applicationId,
        atsscore,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.name : error?.constructor?.name || 'Unknown';
      
      logger.error('Error calculating ATS score:', {
        applicationId,
        jobId,
        resumeUrl: resumeUrl || 'none',
        hasResumeBuffer: !!resumeBuffer,
        resumeMimeType: resumeMimeType || 'none',
        errorName,
        errorMessage,
        errorStack,
        fullError: error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : 'No error object',
      });
    }
  }

  async getUserApplications(userId: string, page: number = 1, limit: number = 10, status?: string): Promise<UserApplicationsResponse> {
    const { applications, total } = page && limit 
      ? await this._applicationRepository.findByUserIdPaginated(userId, page, limit, status)
      : { applications: await this._applicationRepository.findByUserId(userId), total: 0 };
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        try {
          const jobData = await this._jobServiceClient.getJobById(app.jobId);
          return {
            ...app,
            jobTitle: jobData.data?.job?.title || jobData.job?.title || 'Job Title',
            companyName: jobData.data?.job?.company || jobData.job?.company || 'Company Name',
          };
        } catch (error) {
          logger.error(`Error enriching application ${app.id} with job details:`, error);
          return {
            ...app,
            jobTitle: 'Job Title',
            companyName: 'Company Name',
          };
        }
      }),
    );
    const finalTotal = total || enrichedApplications.length;

    logger.info('ApplicationService] getUserApplications - applications from repository:', 
      enrichedApplications.map(app => ({ 
        id: app.id, 
        jobTitle: app.jobTitle, 
        companyName: app.companyName, 
      })),
    );

    return mapUserApplicationsResponse(enrichedApplications, finalTotal);
  }

  async checkApplicationStatus(userId: string, jobId: string): Promise<{ hasApplied: boolean; status?: string }> {
    try {
      const application = await this._applicationRepository.checkDuplicateApplication(userId, jobId);
      return {
        hasApplied: !!application && application.status !== ApplicationStatus.WITHDRAWN,
        status: application?.status,
      };
    } catch {
    
      throw new AppError('Failed to check application status', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getApplicationById(id: string): Promise<ApplicationDetailsResponse> {
    const application = await this._applicationRepository.findWithRelations(id);
    if (!application) {
      throw new AppError(Messages.APPLICATION.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }
    
    const externalData = await this.fetchExternalData(application.userId, application.jobId);

    return mapApplicationToDetailsResponse(application, externalData);
  }

  async withdrawApplication(applicationId: string, userId: string): Promise<ApplicationResponse> {
    const application = await this._applicationRepository.findById(applicationId);
    if (!application) {
      throw new AppError(Messages.APPLICATION.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }
    if (application.userId !== userId) {
      throw new AppError(Messages.VALIDATION.UNAUTHORIZED_ACCESS, HttpStatusCode.FORBIDDEN);
    }
    if (application.status === ApplicationStatus.WITHDRAWN) {
      throw new AppError('Application already withdrawn', HttpStatusCode.BAD_REQUEST);
    }

    const updatedApplication = await this._applicationRepository.updateStatus(
      applicationId,
      { status: ApplicationStatus.WITHDRAWN },
      userId,
    );

    try {
      await this._eventService.publish(Events.APPLICATION.WITHDRAWN, {
        applicationId: updatedApplication.id,
        userId: updatedApplication.userId,
        jobId: updatedApplication.jobId,
        companyId: updatedApplication.companyId,
        withdrawnAt: new Date(),
      });
    } catch (error) {
      logger.warn('Kafka not available, continuing...', error);
    }

    return mapApplicationToResponse(updatedApplication);
  }

  async getCompanyApplications(companyId: string, atsScoreMin?: number): Promise<CompanyApplicationsResponse> {
    try {
      const allApplications = await this._applicationRepository.findByCompanyIdWithRelations(companyId, atsScoreMin);
      logger.info(`Total applications for company ${companyId}:`, allApplications.length);
      const applications = allApplications.filter(app => app.status !== ApplicationStatus.WITHDRAWN);
      logger.info('Active applications (excluding WITHDRAWN):', applications.length);
      const stats = calculateApplicationStats(applications);
      logger.info('Stats calculated:', stats);
    
      const externalDataMap = new Map();
      await Promise.all(
        applications.map(async (app) => {
          try {
            const externalData = await this.fetchExternalData(app.userId, app.jobId);
            logger.info(`Fetched data for ${app.id}:`, {
              userName: externalData.userName,
              jobTitle: externalData.jobTitle,
            });
            externalDataMap.set(app.id, {
              userName: externalData.userName,
              userEmail: externalData.userEmail,
              userPhone: null,
              userProfile: null,
              jobTitle: externalData.jobTitle,
              companyName: externalData.companyName,
            });
          } catch (error) {
            logger.error(` Error for application ${app.id}:`, error);
            externalDataMap.set(app.id, {
              userName: 'User Name',
              userEmail: 'User Email',
              userPhone: null,
              userProfile: null,
              jobTitle: 'Unknown Job',
              companyName: 'Unknown Company',
            });
          }
        }),
      );

      return mapCompanyApplicationsResponse(applications, externalDataMap, {
        total: stats.total,
        pending: stats.pending,
        shortlisted: stats.shortlisted,
        rejected: stats.rejected,
      });
    } catch (error) {
      logger.error('ApplicationService Error in getCompanyApplications:', error);
      throw error;
    }
  }

  async updateApplicationStatus(applicationId: string, data: UpdateApplicationStatusInput, changedBy: string): Promise<ApplicationDetailsResponse> {

    const existingApplication = await this._applicationRepository.findById(applicationId);
    if (!existingApplication) {
      throw new AppError(Messages.APPLICATION.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }
    this._statusUpdateService.validateOrThrow(
      existingApplication.status as ApplicationStatus, 
      data.status as ApplicationStatus,
    );
    const updatedApplication = await this._applicationRepository.updateStatus(applicationId, data, changedBy);
    const applicationWithRelations = await this._applicationRepository.findWithRelations(applicationId);
    if (!applicationWithRelations) {
      throw new AppError(Messages.APPLICATION.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }
    try {
      await this._eventService.publish(Events.APPLICATION.STATUS_UPDATED, {
        userId: existingApplication.userId,
        applicationId: updatedApplication.id,
        jobId: existingApplication.jobId,
        oldStatus: existingApplication.status,
        newStatus: updatedApplication.status,
        changedBy,
        reason: data.reason,
        updatedAt: updatedApplication.updatedAt,
      });
    } catch (error) {
      logger.warn('Kafka event publish failed, continuing...', error);
    }

    const externalData = await this.fetchExternalData(
      existingApplication.userId,
      existingApplication.jobId,
    );

    return mapApplicationToDetailsResponse(applicationWithRelations, externalData);
  }

  async addApplicationNote(applicationId: string, data: AddApplicationNoteInput): Promise<ApplicationDetailsResponse> {
    const application = await this._applicationRepository.findById(applicationId);
    if (!application) {
      throw new AppError(Messages.APPLICATION.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    await this._applicationRepository.addNote(applicationId, data);

    const updatedApplication = await this._applicationRepository.findWithRelations(applicationId);
    if (!updatedApplication) {
      throw new AppError(Messages.APPLICATION.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    const externalData = await this.fetchExternalData(
      updatedApplication.userId,
      updatedApplication.jobId,
    );

    return mapApplicationToDetailsResponse(updatedApplication, externalData);
  }

  async getApplicationDetails(applicationId: string, companyId: string): Promise<ApplicationDetailsResponse> {
    const application = await this._applicationRepository.findWithRelations(applicationId);
    if (!application) {
      throw new AppError(Messages.APPLICATION.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }
    if (application.companyId !== companyId) {
      throw new AppError(Messages.VALIDATION.UNAUTHORIZED_ACCESS, HttpStatusCode.FORBIDDEN);
    }
    
    const externalData = await this.fetchExternalData(application.userId, application.jobId);

    return mapApplicationToDetailsResponse(application, externalData);
  }

  async searchApplications(filters: {
  companyId?: string;
  userId?: string;
  status?: string;
  jobId?: string;
  page?: number;
  limit?: number;
}): Promise<{
  applications: ApplicationResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const result = await this._applicationRepository.findPaginated(page, limit, {
      companyId: filters.companyId,
      userId: filters.userId,
      status: filters.status as ApplicationStatus,
      jobId: filters.jobId,
    });

    const applications = result.applications.map(mapApplicationToResponse);
  
    const paginatedResponse = mapPaginatedApplicationsResponse(applications, result.total, page, limit);
  
    return {
      applications: paginatedResponse.data, 
      pagination: paginatedResponse.pagination,
    };
  }

  async getCompanyApplicationStats(companyId: string): Promise<{
    total: number;
    pending: number;
    reviewing: number;
    shortlisted: number;
    rejected: number;
    accepted: number;
    withdrawn: number;
  }> {
    return await this._applicationRepository.getApplicationStats(companyId);
  }
  async bulkUpdateApplicationStatus(
    applicationIds: string[], 
    status: string, 
    changedBy: string,
    companyId: string,
  ): Promise<void> {
    for (const applicationId of applicationIds) {
      const application = await this._applicationRepository.findById(applicationId);
      if (!application) {
        throw new AppError(`Application ${applicationId} not found`, HttpStatusCode.NOT_FOUND);
      }
      if (application.companyId !== companyId) {
        throw new AppError(`Unauthorized to update application ${applicationId}`, HttpStatusCode.FORBIDDEN);
      }
    }
    await this._applicationRepository.bulkUpdateStatus(
      applicationIds, 
      status as ApplicationStatus, 
      changedBy,
    );

    await this._eventService.publish(Events.APPLICATION.BULK_STATUS_UPDATED, {
      applicationIds,
      newStatus: status,
      changedBy,
      companyId,
      updatedAt: new Date(),
    });
  }

  async validateApplicationEligibility(userId: string, jobId: string): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    const existingApplication = await this._applicationRepository.checkDuplicateApplication(userId, jobId);
    if (existingApplication && existingApplication.status !== ApplicationStatus.WITHDRAWN) {
      return {
        eligible: false,
        reason: 'You have already applied for this job',
      };
    }
    try {
      const deadline = await this._jobServiceClient.getJobDeadline(jobId);
      
      if (deadline) {
        const now = new Date();
        
        if (deadline < now) {
          return {
            eligible: false,
            reason: 'Application deadline has passed',
          };
        }
      }
    } catch (error) {
      logger.error('Error checking job deadline:', error);
    }

    return { eligible: true };
  }

  private async fetchExternalData(userId: string, jobId: string): Promise<{
    jobTitle: string;
    companyName: string;
    userName: string;
    userEmail: string;
  }> {
    const externalData = {
      jobTitle: 'Job Title',
      companyName: 'Company Name',
      userName: 'User Name',
      userEmail: 'user@example.com',
    };

    try {
      const userData = await this._userServiceClient.getUserById(userId);
      if (userData.data?.user) {
        externalData.userName = userData.data.user.username || userData.data.user.name || 'User Name';
        externalData.userEmail = userData.data.user.email || 'user@example.com';
      }
    } catch (error) {
      logger.error(`Error fetching user details for ${userId}:`, error);
    }

    try {
      const jobData = await this._jobServiceClient.getJobById(jobId);
      if (jobData.data?.job || jobData.job) {
        externalData.jobTitle = jobData.data?.job?.title || 
                               jobData.data?.title || 
                               jobData.job?.title || 
                               'Job Title';
        externalData.companyName = jobData.data?.job?.company || 
                                   jobData.data?.company ||
                                   jobData.job?.company ||
                                   'Company Name';
      }
    } catch (error) {
      logger.error(`Error fetching job details for ${jobId}:`, error);
    }

    return externalData;
  }

  async getTopApplicantsByApplicationCount(limit: number): Promise<Array<{ userId: string; userName: string; userEmail: string; applicationCount: number }>> {
    const topApplicants = await this._applicationRepository.getTopApplicantsByApplicationCount(limit);
    
    const applicantsWithDetails = await Promise.all(
      topApplicants.map(async (applicant) => {
        try {
          const userData = await this._userServiceClient.getUserById(applicant.userId);
          return {
            userId: applicant.userId,
            userName: userData.data?.user?.name || userData.data?.user?.username || 'Unknown User',
            userEmail: userData.data?.user?.email || 'unknown@example.com',
            applicationCount: applicant.applicationCount,
          };
        } catch (error) {
          logger.error(`Error fetching user details for ${applicant.userId}:`, error);
          return {
            userId: applicant.userId,
            userName: 'Unknown User',
            userEmail: 'unknown@example.com',
            applicationCount: applicant.applicationCount,
          };
        }
      }),
    );

    return applicantsWithDetails;
  }

  async getTopJobsByApplicationCount(limit: number): Promise<Array<{ jobId: string; jobTitle: string; companyName: string; applicationCount: number }>> {
    const topJobs = await this._applicationRepository.getTopJobsByApplicationCount(limit);

    const jobsWithDetails = await Promise.all(
      topJobs.map(async (job) => {
        try {
          const jobData = await this._jobServiceClient.getJobById(job.jobId);
          return {
            jobId: job.jobId,
            jobTitle: jobData.data?.job?.title || 'Unknown Job',
            companyName: jobData.data?.job?.company || 'Unknown Company',
            applicationCount: job.applicationCount,
          };
        } catch (error) {
          logger.error(`Error fetching job details for ${job.jobId}:`, error);
          return {
            jobId: job.jobId,
            jobTitle: 'Unknown Job',
            companyName: 'Unknown Company',
            applicationCount: job.applicationCount,
          };
        }
      }),
    );

    return jobsWithDetails;
  }
}