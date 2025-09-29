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

export const applicationService = {
  applyForJob: async (applicationData: FormData): Promise<ApplicationResponse> => {
    console.log('🔍 [ApplicationService] Sending application with HttpOnly cookies');
    
    // Call application service directly for multipart data
    // HttpOnly cookies will be sent automatically with credentials: 'include'
    const response = await fetch('http://localhost:3004/api/applications/apply', {
      method: 'POST',
      body: applicationData,
      credentials: 'include' // This sends HttpOnly cookies automatically
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [ApplicationService] Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },
  getUserApplications: async () => {
    const response = await api.get<{
      data: { applications: Application[] };
    }>('/applications/user/applications');
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
      reason
    });
    return response.data;
  },
  addApplicationNotes: async (applicationId: string, note: string, addedBy: string) => {
    const response = await api.post<{
      data: ApplicationNotes;
    }>(`/applications/${applicationId}/notes`, {
      note,
      addedBy
    });
    return response.data;
  },
  getApplicationStatusHistory: async (applicationId: string) => {
    const response = await api.get<{
      data: ApplicationStatusHistory[];
    }>(`/applications/${applicationId}/history`);
    return response.data;
  }
}