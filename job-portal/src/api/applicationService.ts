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

export const applicationService = {
  getCompanyApplications: async (companyId: string) => {
    const response = await api.get<{
      data: { applications: Application[] };
    }>(`http://localhost:3004/api/applications/company/${companyId}`);
    return response.data;
  },
  getApplicationDetails: async (applicationId: string) => {
    const response = await api.get<{
      data: Application;
    }>(`http://localhost:3004/api/applications/${applicationId}`);
    return response.data;
  },

  updateApplicationStatus: async (applicationId: string, status: string, reason?: string) => {
    const response = await api.patch<{
      data: Application;
    }>(`http://localhost:3004/api/applications/${applicationId}/status`, {
      status,
      reason
    });
    return response.data;
  },

  addApplicationNotes: async (applicationId: string, note: string, addedBy: string) => {
    const response = await api.post<{
      data: ApplicationNotes;
    }>(`http://localhost:3004/api/applications/${applicationId}/notes`, {
      note,
      addedBy
    });
    return response.data;
  },
  getApplicationStatusHistory: async (applicationId: string) => {
    const response = await api.get<{
      data: ApplicationStatusHistory[];
    }>(`http://localhost:3004/api/applications/${applicationId}/history`);
    return response.data;
  }
};