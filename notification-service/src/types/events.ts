/**
 * Event data types for notification service
 * These interfaces define the structure of event data received from Kafka
 */

export interface ApplicationCreatedEventData {
  companyId: string;
  applicationId: string;
  jobId: string;
  applicantName?: string;
  jobTitle?: string;
}

export interface StatusUpdatedEventData {
  userId: string;
  applicationId: string;
  jobId: string;
  oldStatus: string;
  newStatus: string;
}

export interface InterviewConfirmedEventData {
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
  confirmedBy: string;
  confirmedAt: Date;
}

export interface InterviewDecisionEventData {
  userId: string;
  interviewId: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  decision: string;
  decisionReason?: string;
  feedback?: string;
  decidedBy: string;
  decidedAt: Date;
}

export interface ApplicationWithdrawnEventData {
  companyId: string;
  applicationId: string;
  jobId: string;
  applicantName?: string;
  jobTitle?: string;
}

