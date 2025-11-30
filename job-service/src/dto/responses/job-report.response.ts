import { JobResponse } from './job.response';

export interface JobReportResponse {
  id: string;
  jobId: string;
  userId: string;
  reason: string;
  createdAt: Date;
  job?: JobResponse;
}

export interface ReportedJobResponse {
  job: JobResponse;
  reports: JobReportResponse[];
  reportCount: number;
}

