import { InterviewResponse, InterviewWithDetailsResponse } from '../../dto/responses/interview.response';
import { CreateInterviewInput, UpdateInterviewInput, InterviewDecisionInput } from '../../dto/schemas/interview.schema';

export interface IInterviewService {
  scheduleInterview(data: CreateInterviewInput, scheduledBy: string): Promise<InterviewResponse>;
  
  getInterviewById(id: string): Promise<InterviewWithDetailsResponse>;
  
  getInterviewsByApplication(applicationId: string): Promise<InterviewResponse[]>;
  
  getCompanyInterviews(companyId: string): Promise<InterviewWithDetailsResponse[]>;
  
  getCandidateInterviews(userId: string): Promise<InterviewWithDetailsResponse[]>;
  
  updateInterview(id: string, data: UpdateInterviewInput, updatedBy: string): Promise<InterviewResponse>;
  
  cancelInterview(id: string, cancelledBy: string, reason?: string): Promise<InterviewResponse>;
  
  makeInterviewDecision(id: string, data: InterviewDecisionInput, decidedBy: string): Promise<InterviewResponse>;
}