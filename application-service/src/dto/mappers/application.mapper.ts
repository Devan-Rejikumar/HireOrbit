import { Application, ApplicationStatusHistory, ApplicationNotes } from '@prisma/client';
import { ApplicationResponse, ApplicationDetailsResponse, ApplicationStatusHistoryResponse, ApplicationNoteResponse,CompanyApplicationsResponse,UserApplicationsResponse } from '../responses/application.response';

export function mapApplicationToResponse(application: Application): ApplicationResponse {
  return {
    id: application.id,
    jobId: application.jobId,
    userId: application.userId,
    companyId: application.companyId,
    status: application.status as ApplicationResponse['status'],
    coverLetter: application.coverLetter,
    expectedSalary: application.expectedSalary,
    availability: application.availability,
    experience: application.experience,
    resumeUrl: application.resumeUrl,
    appliedAt: application.appliedAt,
    updatedAt: application.updatedAt,
  };
}

export function mapApplicationStatusHistoryToResponse(statusHistory: ApplicationStatusHistory): ApplicationStatusHistoryResponse {
  return {
    id: statusHistory.id,
    status: statusHistory.status,
    changedAt: statusHistory.changedAt,
    changedBy: statusHistory.changedBy,
    reason: statusHistory.reason,
  };
}

export function mapApplicationNoteToResponse(note: ApplicationNotes): ApplicationNoteResponse {
  return {
    id: note.id,
    note: note.note,
    addedBy: note.addedBy,
    addedAt: note.addedAt,
  };
}

export function mapApplicationToDetailsResponse(application: Application & {statusHistory: ApplicationStatusHistory[];notes: ApplicationNotes[];
  },
externalData: {
    jobTitle: string;
    companyName: string;
    userName: string;
    userEmail: string;
  },
): ApplicationDetailsResponse {
  return {
    ...mapApplicationToResponse(application),
    jobTitle: externalData.jobTitle,
    companyName: externalData.companyName,
    userName: externalData.userName,
    userEmail: externalData.userEmail,
    statusHistory: application.statusHistory.map(mapApplicationStatusHistoryToResponse),
    notes: application.notes.map(mapApplicationNoteToResponse),
  };
}

export function mapApplicationsToResponse(applications: Application[]): ApplicationResponse[] {
  return applications.map(mapApplicationToResponse);
}

export function mapApplicationsToDetailsResponse(applications: Array<Application & {statusHistory: ApplicationStatusHistory[];notes: ApplicationNotes[];
  }>,
externalDataMap: Map<string, {
    jobTitle: string;
    companyName: string;
    userName: string;
    userEmail: string;
  }>,
): ApplicationDetailsResponse[] {
  return applications.map(application => {
    const externalData = externalDataMap.get(application.id);
    if (!externalData) {
      throw new Error(`External data not found for application ${application.id}`);
    }
    return mapApplicationToDetailsResponse(application, externalData);
  });
}

export function mapCompanyApplicationsResponse(applications: Array<Application & {statusHistory: ApplicationStatusHistory[];notes: ApplicationNotes[];
  }>,
externalDataMap: Map<string, {
    jobTitle: string;
    companyName: string;
    userName: string;
    userEmail: string;
  }>,
stats: {
    total: number;
    pending: number;
    shortlisted: number;
    rejected: number;
  },
): CompanyApplicationsResponse {
  return {
    applications: mapApplicationsToDetailsResponse(applications, externalDataMap),
    total: stats.total,
    pending: stats.pending,
    shortlisted: stats.shortlisted,
    rejected: stats.rejected,
  };
}

export function mapUserApplicationsResponse(
  applications: Array<Application & {
    jobTitle?: string;
    companyName?: string;
    userName?: string;
    userEmail?: string;
  }>,
  total: number,
): UserApplicationsResponse {
  const result = {
    applications: applications.map(application => {
      const baseResponse = mapApplicationToResponse(application);
      const mappedApp = {
        ...baseResponse,
        jobTitle: application.jobTitle || 'Job Title',
        companyName: application.companyName || 'Company Name',
        userName: application.userName || 'User Name',
        userEmail: application.userEmail || 'user@example.com',
        statusHistory: [],
        notes: [],
      };
      
      return mappedApp;
    }),
    total,
  };

  return result;
}

export function calculateApplicationStats(applications: Application[]): {
  total: number;
  pending: number;
  reviewing: number;
  shortlisted: number;
  rejected: number;
  accepted: number;
  withdrawn: number;
} {
  const stats = {
    total: applications.length,
    pending: 0,
    reviewing: 0,
    shortlisted: 0,
    rejected: 0,
    accepted: 0,
    withdrawn: 0,
  };

  applications.forEach(app => {
    switch (app.status) {
    case 'PENDING':
      stats.pending++;
      break;
    case 'REVIEWING':
      stats.reviewing++;
      break;
    case 'SHORTLISTED':
      stats.shortlisted++;
      break;
    case 'REJECTED':
      stats.rejected++;
      break;
    case 'ACCEPTED':
      stats.accepted++;
      break;
    case 'WITHDRAWN':
      stats.withdrawn++;
      break;
    }
  });

  return stats;
}

export function mapPaginatedApplicationsResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
export function isApplicationWithRelations(
  application: Application | (Application & { statusHistory: ApplicationStatusHistory[]; notes: ApplicationNotes[] }),
): application is Application & { statusHistory: ApplicationStatusHistory[]; notes: ApplicationNotes[] } {
  return 'statusHistory' in application && 'notes' in application;
}