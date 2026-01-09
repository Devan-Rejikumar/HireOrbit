import api from './axios';
import { WebRTCConfigResponse } from '@/types/webrtc.types';
import { API_ROUTES } from '../constants/apiRoutes';

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

const CONTENT_TYPE_JSON = 'application/json';

export const _interviewService = {
  scheduleInterview: async (interviewData: CreateInterviewData): Promise<InterviewResponse> => {
    const response = await api.post<InterviewResponse>(API_ROUTES.INTERVIEWS.BASE, interviewData, {
      headers: {
        'Content-Type': CONTENT_TYPE_JSON,
      },
    });
    return response.data;
  },

  getInterviewById: async (interviewId: string): Promise<InterviewWithDetailsResponse> => {
    const response = await api.get<InterviewWithDetailsResponse>(API_ROUTES.INTERVIEWS.GET_BY_ID(interviewId));
    return response.data;
  },

  updateInterview: async (interviewId: string, updateData: UpdateInterviewData): Promise<InterviewResponse> => {
    const response = await api.put<InterviewResponse>(API_ROUTES.INTERVIEWS.UPDATE(interviewId), updateData, {
      headers: {
        'Content-Type': CONTENT_TYPE_JSON,
      },
    });
    return response.data;
  },

  cancelInterview: async (interviewId: string, reason?: string): Promise<InterviewResponse> => {
    const config = {
      headers: {
        'Content-Type': CONTENT_TYPE_JSON,
      },
      ...(reason && { data: { reason } }),
    };
    
    const response = await api.delete<InterviewResponse>(
      API_ROUTES.INTERVIEWS.DELETE(interviewId),
      config,
    );
    return response.data;
  },

  getInterviewsByApplication: async (applicationId: string): Promise<InterviewListResponse> => {
    const response = await api.get<InterviewListResponse>(API_ROUTES.INTERVIEWS.BY_APPLICATION(applicationId));
    return response.data;
  },

  getCompanyInterviews: async (): Promise<InterviewListResponse> => {
    const response = await api.get<InterviewListResponse>(API_ROUTES.INTERVIEWS.COMPANY_ALL);
    return response.data;
  },

  getCandidateInterviews: async (page: number = 1, limit: number = 10, status?: string, search?: string): Promise<{
    success: boolean;
    data: {
      interviews: InterviewWithDetails[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
    message: string;
  }> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    
    const response = await api.get<{
      success: boolean;
      data: {
        interviews: InterviewWithDetails[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
      message: string;
    }>(`${API_ROUTES.INTERVIEWS.CANDIDATE_ALL}?${params.toString()}`);
    return response.data;
  },

  makeInterviewDecision: async (interviewId: string, decisionData: InterviewDecisionData): Promise<InterviewResponse> => {
    const response = await api.post<InterviewResponse>(API_ROUTES.INTERVIEWS.DECISION(interviewId), decisionData, {
      headers: {
        'Content-Type': CONTENT_TYPE_JSON,
      },
    });
    return response.data;
  },

  getWebRTCConfig: async (interviewId: string): Promise<WebRTCConfigResponse> => {
    const response = await api.get<WebRTCConfigResponse>(API_ROUTES.INTERVIEWS.WEBRTC_CONFIG(interviewId));
    return response.data;
  },
};