import { ApplicationResponse, ApplicationDetailsResponse,CompanyApplicationsResponse,UserApplicationsResponse } from '../dto/responses/application.response';
import { CreateApplicationInput, UpdateApplicationStatusInput, AddApplicationNoteInput } from '../dto/schemas/application.schema';

export interface IApplicationService {
  applyForJob(data: CreateApplicationInput): Promise<ApplicationResponse>;
  getUserApplications(userId: string): Promise<UserApplicationsResponse>;
  checkApplicationStatus(userId: string, jobId: string): Promise<{ hasApplied: boolean }>;
  getApplicationById(id: string): Promise<ApplicationDetailsResponse>;
  withdrawApplication(applicationId: string, userId: string): Promise<ApplicationResponse>;
  getCompanyApplications(companyId: string): Promise<CompanyApplicationsResponse>;
  updateApplicationStatus(
    applicationId: string, 
    data: UpdateApplicationStatusInput, 
    changedBy: string
  ): Promise<ApplicationDetailsResponse>;
  addApplicationNote(
    applicationId: string, 
    data: AddApplicationNoteInput
  ): Promise<ApplicationDetailsResponse>;
  getApplicationDetails(applicationId: string, companyId: string): Promise<ApplicationDetailsResponse>;

  
  searchApplications(filters: {
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
  }>;

  getCompanyApplicationStats(companyId: string): Promise<{
    total: number;
    pending: number;
    reviewing: number;
    shortlisted: number;
    rejected: number;
    accepted: number;
    withdrawn: number;
  }>;

  bulkUpdateApplicationStatus(
    applicationIds: string[], 
    status: string, 
    changedBy: string,
    companyId: string
  ): Promise<void>;
  validateApplicationEligibility(userId: string, jobId: string): Promise<{
    eligible: boolean;
    reason?: string;
  }>;
  
}