import { INotificationDocument } from '../../models/NotificationModel';
import { CreateNotificationInput, NotificationType } from '../../types/notifications';
export interface ApplicationReceivedInput {
  companyId: string;
  applicationId: string;
  jobId: string;
  applicantName: string;
  jobTitle: string;
}

export interface StatusUpdatedInput {
  userId: string;
  applicationId: string;
  jobId: string;
  oldStatus: string;
  newStatus: string;
}

export interface ApplicationWithdrawnInput {
  companyId: string;
  applicationId: string;
  jobId: string;
  applicantName: string;
  jobTitle: string;
}

export interface InterviewConfirmedInput {
  userId: string;
  interviewId: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  scheduledAt: Date | string;
  type?: string;
  location?: string;
  meetingLink?: string;
}

export class NotificationMapper {
  static toApplicationReceivedNotification(input: ApplicationReceivedInput): CreateNotificationInput {
    return {
      recipientId: input.companyId,
      type: NotificationType.APPLICATION_RECEIVED,
      title: 'New Application Received',
      message: `${input.applicantName} applied for ${input.jobTitle}`,
      data: {
        applicationId: input.applicationId,
        jobId: input.jobId,
        applicantName: input.applicantName,
        jobTitle: input.jobTitle
      }
    };
  }

  static toStatusUpdatedNotification(input: StatusUpdatedInput, jobTitle: string = 'Job'): CreateNotificationInput {
    return {
      recipientId: input.userId,
      type: NotificationType.STATUS_UPDATED,
      title: 'Application Status Updated',
      message: `${jobTitle} status has been changed to ${input.newStatus}`,
      data: {
        applicationId: input.applicationId,
        jobId: input.jobId,
        jobTitle: jobTitle,
        oldStatus: input.oldStatus,
        newStatus: input.newStatus
      }
    };
  }

  static toApplicationWithdrawnNotification(input: ApplicationWithdrawnInput): CreateNotificationInput {
    return {
      recipientId: input.companyId,
      type: NotificationType.APPLICATION_WITHDRAWN,
      title: 'Application Withdrawn',
      message: `${input.applicantName} withdrew their application for ${input.jobTitle}`,
      data: {
        applicationId: input.applicationId,
        jobId: input.jobId,
        applicantName: input.applicantName,
        jobTitle: input.jobTitle
      }
    };
  }

  static toInterviewConfirmedNotification(input: InterviewConfirmedInput): CreateNotificationInput {
    return {
      recipientId: input.userId,
      type: NotificationType.INTERVIEW_CONFIRMED,
      title: 'Interview Confirmed',
      message: `Your interview for ${input.jobTitle} has been confirmed`,
      data: {
        applicationId: input.applicationId,
        jobId: input.jobId,
        jobTitle: input.jobTitle,
        interviewId: input.interviewId,
        scheduledAt: typeof input.scheduledAt === 'string' ? input.scheduledAt : input.scheduledAt.toISOString(),
        type: input.type,
        location: input.location,
        meetingLink: input.meetingLink
      }
    };
  }
}