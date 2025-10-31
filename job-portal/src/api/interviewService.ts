import api from './axios';
import { getAuthHeaders } from '../utils/authUtils';

export interface Interview {
  id: string;
  applicationId: string;
  scheduledAt: string;
  duration: number;
  type: 'ONLINE' | 'OFFLINE' | 'PHONE';
  location?: string;
  meetingLink?: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'SELECTED' | 'REJECTED';
  notes?: string;
  decisionReason?: string;
  feedback?: string;
  decidedAt?: string;
  decidedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewWithDetails extends Interview {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
}

export interface CreateInterviewData {
  applicationId: string;
  scheduledAt: string;
  duration: number;
  type: 'ONLINE' | 'OFFLINE' | 'PHONE';
  location?: string;
  meetingLink?: string;
  notes?: string;
}

export interface UpdateInterviewData {
  scheduledAt?: string;
  duration?: number;
  type?: 'ONLINE' | 'OFFLINE' | 'PHONE';
  location?: string;
  meetingLink?: string;
  notes?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'SELECTED' | 'REJECTED';
}

export interface InterviewDecisionData {
  status: 'SELECTED' | 'REJECTED';
  decisionReason: string;
  feedback?: string;
}

export interface InterviewResponse {
  success: boolean;
  data: Interview;
  message: string;
}

export interface InterviewWithDetailsResponse {
  success: boolean;
  data: InterviewWithDetails;
  message: string;
}

export interface InterviewListResponse {
  success: boolean;
  data: InterviewWithDetails[];
  message: string;
}

export const interviewService = {
  scheduleInterview: async (interviewData: CreateInterviewData): Promise<InterviewResponse> => {
    const response = await api.post<InterviewResponse>('/interviews', interviewData, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    return response.data;
  },

  getInterviewById: async (interviewId: string): Promise<InterviewWithDetailsResponse> => {
    const response = await api.get<InterviewWithDetailsResponse>(`/interviews/${interviewId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  updateInterview: async (interviewId: string, updateData: UpdateInterviewData): Promise<InterviewResponse> => {
    const response = await api.put<InterviewResponse>(`/interviews/${interviewId}`, updateData, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    return response.data;
  },

  cancelInterview: async (interviewId: string, reason?: string): Promise<InterviewResponse> => {
    const response = await api.delete<InterviewResponse>(`/interviews/${interviewId}`, {
      data: { reason },
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    return response.data;
  },

  getInterviewsByApplication: async (applicationId: string): Promise<InterviewListResponse> => {
    const response = await api.get<InterviewListResponse>(`/interviews/application/${applicationId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getCompanyInterviews: async (): Promise<InterviewListResponse> => {
    const response = await api.get<InterviewListResponse>('/interviews/company/all', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getCandidateInterviews: async (): Promise<InterviewListResponse> => {
    const response = await api.get<InterviewListResponse>('/interviews/candidate/all', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  makeInterviewDecision: async (interviewId: string, decisionData: InterviewDecisionData): Promise<InterviewResponse> => {
    const response = await api.post<InterviewResponse>(`/interviews/${interviewId}/decision`, decisionData, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    return response.data;
  }
};
