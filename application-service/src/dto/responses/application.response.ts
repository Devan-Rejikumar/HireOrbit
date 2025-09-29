export interface ApplicationResponse {
  id: string;
  jobId: string;
  userId: string;
  companyId: string;
  status: 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED' | 'WITHDRAWN';
  coverLetter: string;
  expectedSalary: string;
  availability: string;
  experience: string;
  resumeUrl?: string;
  appliedAt: Date;
  updatedAt: Date;
}

export interface ApplicationDetailsResponse extends ApplicationResponse {
  jobTitle: string;
  companyName: string;
  userName: string;
  userEmail: string;
  statusHistory: ApplicationStatusHistoryResponse[];
  notes: ApplicationNoteResponse[];
}

export interface ApplicationStatusHistoryResponse {
  id: string;
  status: string;
  changedAt: Date;
  changedBy: string;
  reason?: string;
}

export interface ApplicationNoteResponse {
  id: string;
  note: string;
  addedBy: string;
  addedAt: Date;
}

export interface CompanyApplicationsResponse {
  applications: ApplicationDetailsResponse[];
  total: number;
  pending: number;
  shortlisted: number;
  rejected: number;
}

export interface UserApplicationsResponse {
  applications: ApplicationDetailsResponse[];
  total: number;
}