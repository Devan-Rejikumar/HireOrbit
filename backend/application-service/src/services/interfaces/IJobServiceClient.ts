import { JobApiResponse } from '../../types/external-api.types';

export interface IJobServiceClient {
  getJobById(jobId: string): Promise<JobApiResponse>;
  getJobDeadline(jobId: string): Promise<Date | null>;
}

