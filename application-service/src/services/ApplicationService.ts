import { injectable, inject } from 'inversify';
import { ApplicationStatus } from '@prisma/client';
import { IApplicationService } from './IApplicationService';
import { IApplicationRepository } from '../repositories/IApplicationRepository';
import { IEventService } from './IEventService';
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

@injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @inject(TYPES.IApplicationRepository) private applicationRepository: IApplicationRepository,
    @inject(TYPES.IEventService) private eventService: IEventService
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
        status: application.status,
        appliedAt: application.appliedAt
      });
    } catch (error) {
      console.warn('⚠️ Failed to publish application.created event:', error);
    }

    return mapApplicationToResponse(application);
  }

  async getUserApplications(userId: string): Promise<UserApplicationsResponse> {
    const applications = await this.applicationRepository.findByUserId(userId);
    const total = applications.length;

    return mapUserApplicationsResponse(applications, total);
  }

  async checkApplicationStatus(userId: string, jobId: string): Promise<{ hasApplied: boolean }> {
    try {
      const application = await this.applicationRepository.checkDuplicateApplication(userId, jobId);
      return {
        hasApplied: !!application && application.status !== 'WITHDRAWN'
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

    await this.eventService.publish('application.withdrawn', {
      applicationId: updatedApplication.id,
      userId: updatedApplication.userId,
      jobId: updatedApplication.jobId,
      companyId: updatedApplication.companyId,
      withdrawnAt: new Date()
    });

    return mapApplicationToResponse(updatedApplication);
  }

 
  async getCompanyApplications(companyId: string): Promise<CompanyApplicationsResponse> {
    const applications = await this.applicationRepository.findByCompanyIdWithRelations(companyId);
    const stats = calculateApplicationStats(applications);
    const externalDataMap = new Map();
    applications.forEach(app => {
      externalDataMap.set(app.id, {
        jobTitle: 'Job Title',
        companyName: 'Company Name',
        userName: 'User Name',
        userEmail: 'user@example.com'
      });
    });

    return mapCompanyApplicationsResponse(applications, externalDataMap, {
      total: stats.total,
      pending: stats.pending,
      shortlisted: stats.shortlisted,
      rejected: stats.rejected
    });
  }

  async updateApplicationStatus(
    applicationId: string, 
    data: UpdateApplicationStatusInput, 
    changedBy: string
  ): Promise<ApplicationDetailsResponse> {
    const existingApplication = await this.applicationRepository.findById(applicationId);
    if (!existingApplication) {
      throw new Error('Application not found');
    }


    this.validateStatusTransition(existingApplication.status as ApplicationStatus, data.status as ApplicationStatus);

 
    const updatedApplication = await this.applicationRepository.updateStatus(applicationId, data, changedBy);
    const applicationWithRelations = await this.applicationRepository.findWithRelations(applicationId);
    if (!applicationWithRelations) {
      throw new Error('Application not found after update');
    }

    await this.eventService.publish('application.status_updated', {
      applicationId: updatedApplication.id,
      oldStatus: existingApplication.status,
      newStatus: updatedApplication.status,
      changedBy,
      reason: data.reason,
      updatedAt: updatedApplication.updatedAt
    });

    const externalData = {
      jobTitle: 'Job Title',
      companyName: 'Company Name',
      userName: 'User Name',
      userEmail: 'user@example.com'
    };

    return mapApplicationToDetailsResponse(applicationWithRelations, externalData);
  }

  async addApplicationNote(
    applicationId: string, 
    data: AddApplicationNoteInput
  ): Promise<ApplicationDetailsResponse> {
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
    if (existingApplication) {
      return {
        eligible: false,
        reason: 'You have already applied for this job'
      };
    }

    return { eligible: true };
  }
  private validateStatusTransition(currentStatus: ApplicationStatus, newStatus: ApplicationStatus): void {
    const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      PENDING: ['REVIEWING', 'REJECTED', 'WITHDRAWN'],
      REVIEWING: ['SHORTLISTED', 'REJECTED', 'PENDING'],
      SHORTLISTED: ['ACCEPTED', 'REJECTED', 'REVIEWING'],
      REJECTED: [], 
      ACCEPTED: [], 
      WITHDRAWN: [] 
    };

    const allowedStatuses = validTransitions[currentStatus];
    if (!allowedStatuses.includes(newStatus)) {
      throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
  }
}