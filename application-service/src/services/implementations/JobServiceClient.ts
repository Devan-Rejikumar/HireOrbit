import { injectable } from 'inversify';
import { IJobServiceClient } from '../interfaces/IJobServiceClient';
import { JobApiResponse } from '../../types/external-api.types';
import { logger } from '../../utils/logger';
import { AppConfig } from '../../config/app.config';

@injectable()
export class JobServiceClient implements IJobServiceClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = AppConfig.JOB_SERVICE_URL;
  }

  async getJobById(jobId: string): Promise<JobApiResponse> {
    try {
      const timeout = AppConfig.HTTP_CLIENT_TIMEOUT; 
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.warn(`JobServiceClient: Failed to fetch job ${jobId}, status: ${response.status}`);
        return {};
      }

      const data = await response.json() as JobApiResponse;
      return data;
    } catch (error: unknown) {
      const err = error as { name?: string };
      if (err.name === 'AbortError') {
        logger.error(`JobServiceClient: Request timeout for job ${jobId}`);
      } else {
        logger.error(`JobServiceClient: Error fetching job ${jobId}:`, error);
      }
      return {};
    }
  }

  async getJobDeadline(jobId: string): Promise<Date | null> {
    try {
      const jobData = await this.getJobById(jobId);
      const deadline = jobData.data?.job?.applicationDeadline;
      
      if (deadline) {
        return new Date(deadline);
      }
      
      return null;
    } catch (error) {
      logger.error(`JobServiceClient: Error fetching job deadline for ${jobId}:`, error);
      return null;
    }
  }
}

