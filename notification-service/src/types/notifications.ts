export interface Notification {
    id: string;
    recipientId: string;
    type: NotificationType;
    title: string;
    message: string;
    data: NotificationData;
    read: boolean;
    createdAt: Date;
    readAt?: Date;
}

export enum NotificationType {
    APPLICATION_RECEIVED = 'APPLICATION_RECEIVED',
    STATUS_UPDATED = 'STATUS_UPDATED',
    APPLICATION_WITHDRAWN = 'APPLICATION_WITHDRAWN',
    INTERVIEW_CONFIRMED = 'INTERVIEW_CONFIRMED',
    INTERVIEW_DECISION = 'INTERVIEW_DECISION'
}

export interface NotificationData {
    applicationId: string;
    jobId?: string;
    status?: string;
    applicantName?: string;
    jobTitle?: string
    oldStatus?: string;   
    newStatus?: string;
    interviewId?: string;
    scheduledAt?: string;
    type?: string;
    location?: string;
    meetingLink?: string;
    decision?: string;
    decisionReason?: string;
    feedback?: string;
}

export interface CreateNotificationInput {
    recipientId: string;
    type: NotificationType;
    title: string;
    message: string;
    data: NotificationData;
}