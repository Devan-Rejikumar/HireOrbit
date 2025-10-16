import { injectable, inject } from 'inversify';
import { ApplicationStatus } from '@prisma/client';
import { IApplicationService } from './IApplicationService';
import { IApplicationRepository } from '../repositories/IApplicationRepository';
import { IEventService } from './IEventService';
import { StatusUpdateService } from './StatusUpdateService';
import { 
  ApplicationResponse, 
  ApplicationDetailsResponse,
  CompanyApplicationsResponse,
  UserApplicationsResponse 
} from '../dto/responses/application.response';
import { 
  CreateApplicationInput, 
  UpdateApplicationStatusInput, 
  AddApplicationNoteInput 
} from '../dto/schemas/application.schema';
import {
  mapApplicationToResponse,
  mapApplicationToDetailsResponse,
  mapUserApplicationsResponse,
  mapCompanyApplicationsResponse,
  mapPaginatedApplicationsResponse,
  calculateApplicationStats
} from '../dto/mappers/application.mapper';
import {TYPES} from '../config/types';

interface UserApiResponse {
  data?: {
    user?: {
      id?: string;
      name?: string;
      username?: string; // ✅ Add username field
      email?: string;
      role?: string;
      phone?: string;
      profile?: unknown;
    };
  };
}

interface JobApiResponse {
  data?: {
    job?: {
      title?: string;
      company?: string;
    };
  };
}



@injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @inject(TYPES.IApplicationRepository) private applicationRepository: IApplicationRepository,
    @inject(TYPES.IEventService) private eventService: IEventService,
    @inject(TYPES.StatusUpdateService) private statusUpdateService: StatusUpdateService
  ) {}

  async applyForJob(data: CreateApplicationInput): Promise<ApplicationResponse> {
  
    const eligibility = await this.validateApplicationEligibility(data.userId, data.jobId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'Not eligible to apply for this job');
    }


    const application = await this.applicationRepository.create(data);
    
 try {
  await this.eventService.publish('application.created', {
    applicationId: application.id,
    userId: application.userId,
    jobId: application.jobId,
    companyId: application.companyId,
  });
} catch (error) {
  console.warn('Kafka not available, continuing...', error);
}

    return mapApplicationToResponse(application);
  }

  async getUserApplications(userId: string): Promise<UserApplicationsResponse> {
    const applications = await this.applicationRepository.findByUserId(userId);
    const total = applications.length;

    console.log('🔍 [ApplicationService] getUserApplications - applications from repository:', 
      applications.map(app => ({ 
        id: app.id, 
        jobTitle: app.jobTitle, 
        companyName: app.companyName 
      }))
    );

    return mapUserApplicationsResponse(applications, total);
  }

async checkApplicationStatus(userId: string, jobId: string): Promise<{ hasApplied: boolean; status?: string }> {
  try {
    const application = await this.applicationRepository.checkDuplicateApplication(userId, jobId);
    return {
      hasApplied: !!application && application.status !== 'WITHDRAWN',
      status: application?.status
    };
  } catch (error) {
    console.error('Error checking application status:', error);
    throw new Error('Failed to check application status');
  }
}

  async getApplicationById(id: string): Promise<ApplicationDetailsResponse> {
    const application = await this.applicationRepository.findWithRelations(id);
    if (!application) {
      throw new Error('Application not found');
    }
    const externalData = {
      jobTitle: 'Job Title',
      companyName: 'Company Name', 
      userName: 'User Name',
      userEmail: 'user@example.com' 
    };

    return mapApplicationToDetailsResponse(application, externalData);
  }

  async withdrawApplication(applicationId: string, userId: string): Promise<ApplicationResponse> {
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }
    if (application.userId !== userId) {
      throw new Error('Unauthorized to withdraw this application');
    }
    if (application.status === 'WITHDRAWN') {
      throw new Error('Application already withdrawn');
    }

    const updatedApplication = await this.applicationRepository.updateStatus(
      applicationId,
      { status: 'WITHDRAWN' },
      userId
    );

    try {
      await this.eventService.publish('application.withdrawn', {
        applicationId: updatedApplication.id,
        userId: updatedApplication.userId,
        jobId: updatedApplication.jobId,
        companyId: updatedApplication.companyId,
        withdrawnAt: new Date()
      });
    } catch (error) {
      console.warn('Kafka not available, continuing...', error);
    }

    return mapApplicationToResponse(updatedApplication);
  }

  async getCompanyApplications(companyId: string): Promise<CompanyApplicationsResponse> {
    try {
      const allApplications = await this.applicationRepository.findByCompanyIdWithRelations(companyId);
      console.log(`Total applications for company ${companyId}:`, allApplications.length);
      const applications = allApplications.filter(app => app.status !== 'WITHDRAWN');
      console.log(`Active applications (excluding WITHDRAWN):`, applications.length);
      const stats = calculateApplicationStats(applications);
      console.log(`Stats calculated:`, stats);
    
      const externalDataMap = new Map();
      await Promise.all(
        applications.map(async (app) => {
          try {
            // ✅ Add debugging
            console.log(`🔍 [ApplicationService] Processing application ${app.id}:`);
            console.log(`🔍 [ApplicationService] - userId: ${app.userId}`);
            console.log(`🔍 [ApplicationService] - jobId: ${app.jobId}`);
            
            const userRes = await fetch(`http://localhost:3000/api/users/${app.userId}`);
            console.log(`🔍 [ApplicationService] - User API response status: ${userRes.status}`);
            
            const userData = (userRes.ok ? await userRes.json() : {}) as UserApiResponse;
            console.log(`🔍 [ApplicationService] - User API response data:`, JSON.stringify(userData, null, 2));
            const jobRes = await fetch(`http://localhost:3002/api/jobs/${app.jobId}`);
            const jobData = (jobRes.ok ? await jobRes.json() : {}) as JobApiResponse;
            
            console.log(`Fetched data for ${app.id}:`, {
              userName: userData.data?.user?.name,
              jobTitle: jobData.data?.job?.title
            });
            externalDataMap.set(app.id, {
              userName: userData.data?.user?.username || userData.data?.user?.name || 'Unknown User', // ✅ Try username first, then name
              userEmail: userData.data?.user?.email || 'Unknown Email',
              userPhone: null,
              userProfile: null,
              jobTitle: jobData.data?.job?.title || 'Unknown Job',
              companyName: jobData.data?.job?.company || 'Unknown Company'
            });
            
          } catch (error) {
            console.error(` Error for application ${app.id}:`, error);
            externalDataMap.set(app.id, {
              userName: `User Name`,
              userEmail: `User Email`,
              userPhone: null,
              userProfile: null,
              jobTitle: 'Unknown Job',
              companyName: 'Unknown Company'
            });
          }
        })
      );

      return mapCompanyApplicationsResponse(applications, externalDataMap, {
        total: stats.total,
        pending: stats.pending,
        shortlisted: stats.shortlisted,
        rejected: stats.rejected
      });
    } catch (error) {
      console.error('ApplicationService Error in getCompanyApplications:', error);
      throw error;
    }
  }

  async updateApplicationStatus(applicationId: string, data: UpdateApplicationStatusInput, changedBy: string): Promise<ApplicationDetailsResponse> {

    const existingApplication = await this.applicationRepository.findById(applicationId);
    if (!existingApplication) {
      throw new Error('Application not found');
    }
    this.statusUpdateService.validateOrThrow(
      existingApplication.status as ApplicationStatus, 
      data.status as ApplicationStatus
    );
    const updatedApplication = await this.applicationRepository.updateStatus(applicationId, data, changedBy);
    const applicationWithRelations = await this.applicationRepository.findWithRelations(applicationId);
    if (!applicationWithRelations) {
      throw new Error('Application not found after update');
    }
    try {
      await this.eventService.publish('application.status_updated', {
        applicationId: updatedApplication.id,
        oldStatus: existingApplication.status,
        newStatus: updatedApplication.status,
        changedBy,
        reason: data.reason,
        updatedAt: updatedApplication.updatedAt
      });
    } catch (error) {
      console.warn('Kafka event publish failed, continuing...', error);
    }

    const externalData = {
      jobTitle: 'Job Title',
      companyName: 'Company Name',
      userName: 'User Name',
      userEmail: 'user@example.com'
    };

    return mapApplicationToDetailsResponse(applicationWithRelations, externalData);
  }

  async addApplicationNote(applicationId: string, data: AddApplicationNoteInput): Promise<ApplicationDetailsResponse> {
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    
    await this.applicationRepository.addNote(applicationId, data);

    
    const updatedApplication = await this.applicationRepository.findWithRelations(applicationId);
    if (!updatedApplication) {
      throw new Error('Application not found after adding note');
    }

    
    const externalData = {
      jobTitle: 'Job Title',
      companyName: 'Company Name',
      userName: 'User Name',
      userEmail: 'user@example.com'
    };

    return mapApplicationToDetailsResponse(updatedApplication, externalData);
  }

  async getApplicationDetails(applicationId: string, companyId: string): Promise<ApplicationDetailsResponse> {
    const application = await this.applicationRepository.findWithRelations(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }
    if (application.companyId !== companyId) {
      throw new Error('Unauthorized to view this application');
    }
    const externalData = {
      jobTitle: 'Job Title',
      companyName: 'Company Name',
      userName: 'User Name',
      userEmail: 'user@example.com'
    };

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

  const result = await this.applicationRepository.findPaginated(page, limit, {
    companyId: filters.companyId,
    userId: filters.userId,
    status: filters.status as ApplicationStatus,
    jobId: filters.jobId
  });

  const applications = result.applications.map(mapApplicationToResponse);
  
  const paginatedResponse = mapPaginatedApplicationsResponse(applications, result.total, page, limit);
  
  return {
    applications: paginatedResponse.data, 
    pagination: paginatedResponse.pagination
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
    return await this.applicationRepository.getApplicationStats(companyId);
  }
  async bulkUpdateApplicationStatus(
    applicationIds: string[], 
    status: string, 
    changedBy: string,
    companyId: string
  ): Promise<void> {
    for (const applicationId of applicationIds) {
      const application = await this.applicationRepository.findById(applicationId);
      if (!application) {
        throw new Error(`Application ${applicationId} not found`);
      }
      if (application.companyId !== companyId) {
        throw new Error(`Unauthorized to update application ${applicationId}`);
      }
    }
    await this.applicationRepository.bulkUpdateStatus(
      applicationIds, 
      status as ApplicationStatus, 
      changedBy
    );

    await this.eventService.publish('application.bulk_status_updated', {
      applicationIds,
      newStatus: status,
      changedBy,
      companyId,
      updatedAt: new Date()
    });
  }

  async validateApplicationEligibility(userId: string, jobId: string): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    const existingApplication = await this.applicationRepository.checkDuplicateApplication(userId, jobId);
    if (existingApplication && existingApplication.status !== 'WITHDRAWN') {
      return {
        eligible: false,
        reason: 'You have already applied for this job'
      };
    }

    return { eligible: true };
  }
}