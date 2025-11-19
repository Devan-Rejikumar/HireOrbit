import api from './axios';

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
const INTERVIEWS_ENDPOINT = '/interviews';

export const _interviewService = {
  scheduleInterview: async (interviewData: CreateInterviewData): Promise<InterviewResponse> => {
    const response = await api.post<InterviewResponse>(INTERVIEWS_ENDPOINT, interviewData, {
      headers: {
        'Content-Type': CONTENT_TYPE_JSON
      }
    });
    return response.data;
  },

  getInterviewById: async (interviewId: string): Promise<InterviewWithDetailsResponse> => {
    const response = await api.get<InterviewWithDetailsResponse>(`${INTERVIEWS_ENDPOINT}/${interviewId}`);
    return response.data;
  },

  updateInterview: async (interviewId: string, updateData: UpdateInterviewData): Promise<InterviewResponse> => {
    const response = await api.put<InterviewResponse>(`${INTERVIEWS_ENDPOINT}/${interviewId}`, updateData, {
      headers: {
        'Content-Type': CONTENT_TYPE_JSON
      }
    });
    return response.data;
  },

  cancelInterview: async (interviewId: string, reason?: string): Promise<InterviewResponse> => {
    const config = {
      headers: {
        'Content-Type': CONTENT_TYPE_JSON
      },
      ...(reason && { data: { reason } })
    };
    
    const response = await api.delete<InterviewResponse>(
      `${INTERVIEWS_ENDPOINT}/${interviewId}`,
      config
    );
    return response.data;
  },

  getInterviewsByApplication: async (applicationId: string): Promise<InterviewListResponse> => {
    const response = await api.get<InterviewListResponse>(`${INTERVIEWS_ENDPOINT}/application/${applicationId}`);
    return response.data;
  },

  getCompanyInterviews: async (): Promise<InterviewListResponse> => {
    const response = await api.get<InterviewListResponse>(`${INTERVIEWS_ENDPOINT}/company/all`);
    return response.data;
  },

  getCandidateInterviews: async (): Promise<InterviewListResponse> => {
    const response = await api.get<InterviewListResponse>(`${INTERVIEWS_ENDPOINT}/candidate/all`);
    return response.data;
  },

  makeInterviewDecision: async (interviewId: string, decisionData: InterviewDecisionData): Promise<InterviewResponse> => {
    const response = await api.post<InterviewResponse>(`${INTERVIEWS_ENDPOINT}/${interviewId}/decision`, decisionData, {
      headers: {
        'Content-Type': CONTENT_TYPE_JSON
      }
    });
    return response.data;
  }
};