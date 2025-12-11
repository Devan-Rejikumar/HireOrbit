import { injectable, inject } from 'inversify';
import { Interview } from '@prisma/client';
import { IInterviewService } from '../interfaces/IInterviewService';
import { IInterviewRepository, InterviewWithApplication } from '../../repositories/interfaces/IInterviewRepository';
import { IApplicationRepository } from '../../repositories/interfaces/IApplicationRepository';
import { IEventService } from '../interfaces/IEventService';
import { IUserServiceClient } from '../interfaces/IUserServiceClient';
import { IJobServiceClient } from '../interfaces/IJobServiceClient';
import { TYPES } from '../../config/types';
import { InterviewResponse, InterviewWithDetailsResponse } from '../../dto/responses/interview.response';
import { CreateInterviewInput, UpdateInterviewInput, InterviewDecisionInput } from '../../dto/schemas/interview.schema';
import { AppError } from '../../utils/errors/AppError';
import { Messages } from '../../constants/Messages';
import { Events } from '../../constants/Events';
import { HttpStatusCode } from '../../enums/StatusCodes';
import { ApplicationStatus } from '../../enums/ApplicationStatus';
import { logger } from '../../utils/logger';

@injectable()
export class InterviewService implements IInterviewService {
  constructor(
    @inject(TYPES.IInterviewRepository) private _interviewRepository: IInterviewRepository,
    @inject(TYPES.IApplicationRepository) private _applicationRepository: IApplicationRepository,
    @inject(TYPES.IEventService) private _eventService: IEventService,
    @inject(TYPES.IUserServiceClient) private _userServiceClient: IUserServiceClient,
    @inject(TYPES.IJobServiceClient) private _jobServiceClient: IJobServiceClient
  ) {}

  async scheduleInterview(data: CreateInterviewInput, scheduledBy: string): Promise<InterviewResponse> {
    const application = await this._applicationRepository.findById(data.applicationId);
    if (!application) {
      throw new AppError(Messages.APPLICATION.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    if (application.status !== ApplicationStatus.SHORTLISTED) {
      throw new AppError('Can only schedule interviews for shortlisted applications', HttpStatusCode.BAD_REQUEST);
    }
    
    // Meeting link is optional - can be provided as fallback (e.g., Zoom, Google Meet)
    // If not provided, we'll use WebRTC video call instead
    const interview = await this._interviewRepository.create({
      applicationId: data.applicationId,
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration,
      type: data.type,
      location: data.location,
      meetingLink: data.meetingLink, // Optional - external meeting link as fallback
      notes: data.notes
    });

    return this.mapToResponse(interview);
  }

  async getInterviewById(id: string): Promise<InterviewWithDetailsResponse> {
    const interview = await this._interviewRepository.findById(id);
    if (!interview) {
      throw new AppError(Messages.INTERVIEW.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    const application = await this._applicationRepository.findById(interview.applicationId);
    if (!application) {
      throw new AppError(Messages.APPLICATION.NOT_FOUND, HttpStatusCode.NOT_FOUND);
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

  async getCandidateInterviews(userId: string, page: number = 1, limit: number = 10, status?: string): Promise<{
    interviews: InterviewWithDetailsResponse[];
    total: number;
  }> {
    const applications = await this._applicationRepository.findByUserId(userId);
    const allInterviews = await Promise.all(
      applications.map(app => this._interviewRepository.findByApplicationId(app.id))
    );
    
    let interviews = allInterviews.flat();
    if (status) {
      interviews = interviews.filter(i => i.status === status);
    }

    const total = interviews.length;
    const skip = (page - 1) * limit;
    const paginatedInterviews = interviews.slice(skip, skip + limit);

    const interviewsWithDetails = await Promise.all(
      paginatedInterviews.map(async (interview) => {
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

    return {
      interviews: interviewsWithDetails.filter(i => i !== null) as InterviewWithDetailsResponse[],
      total
    };
  }

  async updateInterview(id: string, data: UpdateInterviewInput, updatedBy: string): Promise<InterviewResponse> {
    const interview = await this._interviewRepository.findById(id);
    if (!interview) {
      throw new AppError(Messages.INTERVIEW.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    const oldStatus = interview.status;
    const updateData: Partial<Interview> = {};
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
          
          await this._eventService.publish(Events.INTERVIEW.CONFIRMED, {
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
        logger.warn('Failed to publish interview confirmed event:', error);
      }
    }

    return this.mapToResponse(updatedInterview);
  }

  async cancelInterview(id: string, cancelledBy: string, reason?: string): Promise<InterviewResponse> {
    const interview = await this._interviewRepository.findById(id);
    if (!interview) {
      throw new AppError(Messages.INTERVIEW.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    const cancelledInterview = await this._interviewRepository.updateStatus(id, 'CANCELLED');

    return this.mapToResponse(cancelledInterview);
  }

  async makeInterviewDecision(id: string, data: InterviewDecisionInput, decidedBy: string): Promise<InterviewResponse> {
    const interview = await this._interviewRepository.findById(id);
    if (!interview) {
      throw new AppError(Messages.INTERVIEW.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }
    if (interview.status !== 'COMPLETED') {
      throw new AppError('Can only make decision on completed interviews', HttpStatusCode.BAD_REQUEST);
    }
    const updateData = {
      status: data.status,
      decisionReason: data.decisionReason,
      feedback: data.feedback,
      decidedAt: new Date(),
      decidedBy: decidedBy
    };

    const updatedInterview = await this._interviewRepository.update(id, updateData);

    const newApplicationStatus = data.status === 'SELECTED' ? ApplicationStatus.ACCEPTED : ApplicationStatus.REJECTED;
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
      logger.error('Failed to update application status:', error);
    }

    try {
      const application = await this._applicationRepository.findById(interview.applicationId);
      if (application) {
        const jobDetails = await this.fetchJobDetails(application.jobId);
        
        await this._eventService.publish(Events.INTERVIEW.DECISION_MADE, {
          userId: application.userId,
          interviewId: updatedInterview.id,
          applicationId: interview.applicationId,
          jobId: application.jobId,
          jobTitle: jobDetails.title,
          decision: data.status,
          decisionReason: data.decisionReason,
          feedback: data.feedback,
          decidedBy: decidedBy,
          decidedAt: new Date()
        });
      }
    } catch (error) {
      logger.warn('Failed to publish interview decision event:', error);
    }

    return this.mapToResponse(updatedInterview);
  }

  private mapToResponse(interview: Interview): InterviewResponse {
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
      const userData = await this._userServiceClient.getUserById(userId);
      return {
        name: userData.data?.user?.name || userData.data?.user?.username || 'Unknown',
        email: userData.data?.user?.email || 'Unknown'
      };
    } catch (error) {
      logger.error('Failed to fetch user details:', error);
      return { name: 'Unknown', email: 'Unknown' };
    }
  }

  private async fetchJobDetails(jobId: string): Promise<{ title: string; company: string }> {
    try {
      const jobData = await this._jobServiceClient.getJobById(jobId);
      return {
        title: jobData.data?.job?.title || jobData.job?.title || 'Unknown',
        company: jobData.data?.job?.company || jobData.job?.company || 'Unknown'
      };
    } catch (error) {
      logger.error('Failed to fetch job details:', error);
      return { title: 'Unknown', company: 'Unknown' };
    }
  }
}