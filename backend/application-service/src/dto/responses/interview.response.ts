export interface InterviewResponse {
    id: string;
    applicationId: string;
    scheduledAt: Date;
    duration: number;
    type: string;
    location: string | null;
    meetingLink: string | null;
    status: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
  
export interface InterviewWithDetailsResponse extends InterviewResponse {
    candidateName: string;
    candidateEmail: string;
    jobTitle: string;
    companyName: string;
  }