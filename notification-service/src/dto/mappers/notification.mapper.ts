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

  static toStatusUpdatedNotification(input: StatusUpdatedInput): CreateNotificationInput {
    return {
      recipientId: input.userId,
      type: NotificationType.STATUS_UPDATED,
      title: 'Application Status Updated',
      message: `Your application status changed to ${input.newStatus}`,
      data: {
        applicationId: input.applicationId,
        jobId: input.jobId,
        status: input.newStatus
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
}