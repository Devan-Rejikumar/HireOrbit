import api from './axios';
import { API_ROUTES } from '../constants/apiRoutes';

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  companyId: string;
  status: 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED' | 'WITHDRAWN';
  coverLetter?: string;
  expectedSalary?: string;
  availability?: string;
  experience?: string;
  resumeUrl?: string;
  appliedAt: string;
  updatedAt: string;
  jobTitle?: string;
  companyName?: string;
}

export interface ApplicationStatusHistory {
  id: string;
  applicationId: string;
  status: string;
  changedAt: string;
  changedBy: string;
  reason?: string;
}

export interface ApplicationNotes {
  id: string;
  applicationId: string;
  note: string;
  addedBy: string;
  addedAt: string;
}

export interface ApplicationResponse {
  success: boolean;
  data: Application;
  message: string;
}

export interface ApplicationData {
  jobId: string;
  companyId?: string;
  coverLetter?: string;
  expectedSalary?: string;
  availability?: string;
  experience?: string;
  resumeUrl?: string;
  resumeBase64?: string;
  resumeFileName?: string;
}

const CONTENT_TYPE_JSON = 'application/json';

export const _applicationService = {
  applyForJob: async (applicationData: ApplicationData): Promise<ApplicationResponse> => {
    try {
      const response = await api.post<ApplicationResponse>(API_ROUTES.APPLICATIONS.APPLY, applicationData, {
        headers: {
          'Content-Type': CONTENT_TYPE_JSON,
        },
      });
      
      return response.data;
    } catch (error: unknown) {
      // Re-throw with better error message for deadline validation
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
        if (axiosError.response?.status === 400 && axiosError.response?.data?.message) {
          const errorMessage = axiosError.response.data.message;
          if (errorMessage.includes('deadline')) {
            throw new Error('Application deadline has passed. This job is no longer accepting applications.');
          }
          throw new Error(errorMessage);
        }
      }
      throw error;
    }
  },
  
  getUserApplications: async (page: number = 1, limit: number = 10, status?: string, search?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    
    const response = await api.get<{
      data: { 
        applications: Application[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
    }>(`${API_ROUTES.APPLICATIONS.USER_APPLICATIONS}?${params.toString()}`);
    return response.data;
  },

  getApplicationDetails: async (applicationId: string) => {
    const response = await api.get<{
      data: Application;
    }>(API_ROUTES.APPLICATIONS.GET_BY_ID(applicationId));
    return response.data;
  },
  
  withdrawApplication: async (applicationId: string) => {
    const response = await api.patch<{
      data: Application;
    }>(API_ROUTES.APPLICATIONS.WITHDRAW(applicationId));
    return response.data;
  },
  
  getCompanyApplications: async (companyId: string) => {
    const response = await api.get<{
      data: { applications: Application[] };
    }>(API_ROUTES.APPLICATIONS.COMPANY_APPLICATIONS);
    return response.data;
  },
  
  updateApplicationStatus: async (applicationId: string, status: string, reason?: string) => {
    const response = await api.patch<{
      data: Application;
    }>(API_ROUTES.APPLICATIONS.UPDATE_STATUS(applicationId), {
      status,
      reason,
    });
    return response.data;
  },
  
  addApplicationNotes: async (applicationId: string, note: string, addedBy: string) => {
    const response = await api.post<{
      data: ApplicationNotes;
    }>(API_ROUTES.APPLICATIONS.NOTES(applicationId), {
      note,
      addedBy,
    });
    return response.data;
  },
  
  getApplicationStatusHistory: async (applicationId: string) => {
    const response = await api.get<{
      data: ApplicationStatusHistory[];
    }>(API_ROUTES.APPLICATIONS.HISTORY(applicationId));
    return response.data;
  },

  viewResume: async (applicationId: string): Promise<{ resumeUrl: string; expiresAt: string }> => {
    const response = await api.get<{
      success: boolean;
      data: { resumeUrl: string; expiresAt: string };
    }>(API_ROUTES.APPLICATIONS.RESUME.VIEW(applicationId));
    return response.data.data;
  },

  downloadResume: async (applicationId: string): Promise<{ downloadUrl: string; expiresAt: string }> => {
    const response = await api.get<{
      success: boolean;
      data: { downloadUrl: string; expiresAt: string };
    }>(API_ROUTES.APPLICATIONS.RESUME.DOWNLOAD(applicationId));
    return response.data.data;
  },
};