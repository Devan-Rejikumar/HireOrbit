import { injectable, inject } from 'inversify';
import { IInterviewService } from '../interface/IInterviewService';
import { IInterviewRepository, InterviewWithApplication } from '../../repositories/interface/IInterviewRepository';
import { IApplicationRepository } from '../../repositories/interface/IApplicationRepository';
import { IEventService } from '../interface/IEventService';
import { TYPES } from '../../config/types';
import { InterviewResponse, InterviewWithDetailsResponse } from '../../dto/responses/interview.response';
import { CreateInterviewInput, UpdateInterviewInput, InterviewDecisionInput } from '../../dto/schemas/interview.schema';
import axios from 'axios';

interface UserApiResponse {
  data?: {
    user?: {
      id?: string;
      name?: string;
      username?: string;
      email?: string;
    };
  };
}

interface JobApiResponse {
  data?: {
    job?: {
      title?: string;
      company?: string;
    };
  };
}

@injectable()
export class InterviewService implements IInterviewService {
  constructor(
    @inject(TYPES.IInterviewRepository) private _interviewRepository: IInterviewRepository,
    @inject(TYPES.IApplicationRepository) private _applicationRepository: IApplicationRepository,
    @inject(TYPES.IEventService) private _eventService: IEventService
  ) {}

  async scheduleInterview(data: CreateInterviewInput, scheduledBy: string): Promise<InterviewResponse> {
    const application = await this._applicationRepository.findById(data.applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'SHORTLISTED') {
      throw new Error('Can only schedule interviews for shortlisted applications');
    }
    const interview = await this._interviewRepository.create({
      applicationId: data.applicationId,
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration,
      type: data.type,
      location: data.location,
      meetingLink: data.meetingLink,
      notes: data.notes
    });

    return this.mapToResponse(interview);
  }

  async getInterviewById(id: string): Promise<InterviewWithDetailsResponse> {
    const interview = await this._interviewRepository.findById(id);
    if (!interview) {
      throw new Error('Interview not found');
    }

    const application = await this._applicationRepository.findById(interview.applicationId);
    if (!application) {
      throw new Error('Associated application not found');
    }

    const [userDetails, jobDetails] = await Promise.all([
      this.fetchUserDetails(application.userId),
      this.fetchJobDetails(application.jobId)
    ]);

    return {
      ...this.mapToResponse(interview),
      candidateName: userDetails.name || 'Unknown',
      candidateEmail: userDetails.email || 'Unknown',
      jobTitle: jobDetails.title || 'Unknown',
      companyName: jobDetails.company || 'Unknown'
    };
  }

  async getInterviewsByApplication(applicationId: string): Promise<InterviewResponse[]> {
    const interviews = await this._interviewRepository.findByApplicationId(applicationId);
    return interviews.map(interview => this.mapToResponse(interview));
  }

  async getCompanyInterviews(companyId: string): Promise<InterviewWithDetailsResponse[]> {
    const interviews = await this._interviewRepository.findByCompanyId(companyId);
    
    const interviewsWithDetails = await Promise.all(
      interviews.map(async (interview: InterviewWithApplication) => {
        const application = interview.application || 
          await this._applicationRepository.findById(interview.applicationId);
        
        if (!application) {
          return null;
        }

        const [userDetails, jobDetails] = await Promise.all([
          this.fetchUserDetails(application.userId),
          this.fetchJobDetails(application.jobId)
        ]);

        return {
          ...this.mapToResponse(interview),
          candidateName: userDetails.name || 'Unknown',
          candidateEmail: userDetails.email || 'Unknown',
          jobTitle: jobDetails.title || 'Unknown',
          companyName: jobDetails.company || 'Unknown'
        };
      })
    );

    return interviewsWithDetails.filter(i => i !== null) as InterviewWithDetailsResponse[];
  }

  async getCandidateInterviews(userId: string): Promise<InterviewWithDetailsResponse[]> {
    const applications = await this._applicationRepository.findByUserId(userId);
    const allInterviews = await Promise.all(
      applications.map(app => this._interviewRepository.findByApplicationId(app.id))
    );
    
    const interviews = allInterviews.flat();

    const interviewsWithDetails = await Promise.all(
      interviews.map(async (interview) => {
        const application = await this._applicationRepository.findById(interview.applicationId);
        if (!application) {
          return null;
        }

        const [userDetails, jobDetails] = await Promise.all([
          this.fetchUserDetails(application.userId),
          this.fetchJobDetails(application.jobId)
        ]);

        return {
          ...this.mapToResponse(interview),
          candidateName: userDetails.name || 'Unknown',
          candidateEmail: userDetails.email || 'Unknown',
          jobTitle: jobDetails.title || 'Unknown',
          companyName: jobDetails.company || 'Unknown'
        };
      })
    );

    return interviewsWithDetails.filter(i => i !== null) as InterviewWithDetailsResponse[];
  }

  async updateInterview(id: string, data: UpdateInterviewInput, updatedBy: string): Promise<InterviewResponse> {
    const interview = await this._interviewRepository.findById(id);
    if (!interview) {
      throw new Error('Interview not found');
    }

    const oldStatus = interview.status;
    const updateData: any = {};
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
    if (data.duration) updateData.duration = data.duration;
    if (data.type) updateData.type = data.type;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.meetingLink !== undefined) updateData.meetingLink = data.meetingLink;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status) updateData.status = data.status;

    const updatedInterview = await this._interviewRepository.update(id, updateData);
    if (data.status === 'CONFIRMED' && oldStatus !== 'CONFIRMED') {
      try {
        const application = await this._applicationRepository.findById(interview.applicationId);
        if (application) {
          const jobDetails = await this.fetchJobDetails(application.jobId);
          
          await this._eventService.publish('interview.confirmed', {
            userId: application.userId,
            interviewId: updatedInterview.id,
            applicationId: interview.applicationId,
            jobId: application.jobId,
            jobTitle: jobDetails.title,
            companyName: jobDetails.company,
            scheduledAt: updatedInterview.scheduledAt,
            type: updatedInterview.type,
            location: updatedInterview.location,
            meetingLink: updatedInterview.meetingLink,
            confirmedBy: updatedBy,
            confirmedAt: new Date()
          });
        }
      } catch (error) {
        console.warn('Failed to publish interview confirmed event:', error);
      }
    }

    return this.mapToResponse(updatedInterview);
  }

  async cancelInterview(id: string, cancelledBy: string, reason?: string): Promise<InterviewResponse> {
    const interview = await this._interviewRepository.findById(id);
    if (!interview) {
      throw new Error('Interview not found');
    }

    const cancelledInterview = await this._interviewRepository.updateStatus(id, 'CANCELLED');

    return this.mapToResponse(cancelledInterview);
  }

  async makeInterviewDecision(id: string, data: InterviewDecisionInput, decidedBy: string): Promise<InterviewResponse> {
    const interview = await this._interviewRepository.findById(id);
    if (!interview) {
      throw new Error('Interview not found');
    }
    if (interview.status !== 'COMPLETED') {
      throw new Error('Can only make decision on completed interviews');
    }
    const updateData = {
      status: data.status,
      decisionReason: data.decisionReason,
      feedback: data.feedback,
      decidedAt: new Date(),
      decidedBy: decidedBy
    };

    const updatedInterview = await this._interviewRepository.update(id, updateData);

    const newApplicationStatus = data.status === 'SELECTED' ? 'ACCEPTED' : 'REJECTED';
    try {
      await this._applicationRepository.updateStatus(
        interview.applicationId, 
        { 
          status: newApplicationStatus, 
          reason: `Interview ${data.status.toLowerCase()}: ${data.decisionReason}` 
        }, 
        decidedBy
      );
    } catch (error) {
      console.error('Failed to update application status:', error);
    }

    return this.mapToResponse(updatedInterview);
  }

  private mapToResponse(interview: any): InterviewResponse {
    return {
      id: interview.id,
      applicationId: interview.applicationId,
      scheduledAt: interview.scheduledAt,
      duration: interview.duration,
      type: interview.type,
      location: interview.location,
      meetingLink: interview.meetingLink,
      status: interview.status,
      notes: interview.notes,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt
    };
  }

  private async fetchUserDetails(userId: string): Promise<{ name: string; email: string }> {
    try {
      const response = await axios.get<UserApiResponse>(`http://localhost:3001/api/users/${userId}`);
      return {
        name: response.data?.data?.user?.name || response.data?.data?.user?.username || 'Unknown',
        email: response.data?.data?.user?.email || 'Unknown'
      };
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      return { name: 'Unknown', email: 'Unknown' };
    }
  }

  private async fetchJobDetails(jobId: string): Promise<{ title: string; company: string }> {
    try {
      const response = await axios.get<JobApiResponse>(`http://localhost:3002/api/jobs/${jobId}`);
      return {
        title: response.data?.data?.job?.title || 'Unknown',
        company: response.data?.data?.job?.company || 'Unknown'
      };
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      return { title: 'Unknown', company: 'Unknown' };
    }
  }
}