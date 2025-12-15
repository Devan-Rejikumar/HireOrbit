import { JobReport, Job } from '@prisma/client';

export type JobReportWithJob = JobReport & {
  job: Job;
};

export interface IJobReportRepository {
  create(jobId: string, userId: string, reason: string): Promise<JobReport>;
  findAll(): Promise<JobReportWithJob[]>;
  findByJobId(jobId: string): Promise<JobReportWithJob[]>;
  findByUserId(userId: string): Promise<JobReportWithJob[]>;
  findByJobIdAndUserId(jobId: string, userId: string): Promise<JobReport | null>;
  deleteByJobId(jobId: string): Promise<void>;
}
