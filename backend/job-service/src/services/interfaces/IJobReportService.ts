import { JobReportResponse, ReportedJobResponse } from '../../dto/responses/job-report.response';

export interface IJobReportService {
  reportJob(jobId: string, userId: string, reason: string): Promise<JobReportResponse>;
  getAllReportedJobs(): Promise<ReportedJobResponse[]>;
  getReportsByJobId(jobId: string): Promise<JobReportResponse[]>;
}

