import api from './axios';

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
  createdAt?: string;
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
    console.log('[ApplicationService] Sending application with axios');
    
    const response = await api.post<ApplicationResponse>('/applications/apply', applicationData, {
      headers: {
        'Content-Type': CONTENT_TYPE_JSON,
      },
    });
    
    return response.data;
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
    }>(`/applications/user/applications?${params.toString()}`);
    return response.data;
  },

  getApplicationDetails: async (applicationId: string) => {
    const response = await api.get<{
      data: Application;
    }>(`/applications/${applicationId}`);
    return response.data;
  },
  
  withdrawApplication: async (applicationId: string) => {
    const response = await api.patch<{
      data: Application;
    }>(`/applications/${applicationId}/withdraw`);
    return response.data;
  },
  
  getCompanyApplications: async (companyId: string) => {
    const response = await api.get<{
      data: { applications: Application[] };
    }>('/applications/company/applications');
    return response.data;
  },
  
  updateApplicationStatus: async (applicationId: string, status: string, reason?: string) => {
    const response = await api.patch<{
      data: Application;
    }>(`/applications/${applicationId}/status`, {
      status,
      reason,
    });
    return response.data;
  },
  
  addApplicationNotes: async (applicationId: string, note: string, addedBy: string) => {
    const response = await api.post<{
      data: ApplicationNotes;
    }>(`/applications/${applicationId}/notes`, {
      note,
      addedBy,
    });
    return response.data;
  },
  
  getApplicationStatusHistory: async (applicationId: string) => {
    const response = await api.get<{
      data: ApplicationStatusHistory[];
    }>(`/applications/${applicationId}/history`);
    return response.data;
  },
};