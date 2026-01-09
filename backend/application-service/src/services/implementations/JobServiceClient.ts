import { injectable } from 'inversify';
import { IJobServiceClient } from '../interfaces/IJobServiceClient';
import { JobApiResponse } from '../../types/external-api.types';
import { logger } from '../../utils/logger';
import { AppConfig } from '../../config/app.config';
import { ServiceHttpClient, HttpClientConfig } from 'hireorbit-shared-dto';

@injectable()
export class JobServiceClient implements IJobServiceClient {
  private readonly httpClient: ServiceHttpClient;

  constructor() {
    const config: HttpClientConfig = {
      baseUrl: AppConfig.JOB_SERVICE_URL,
      timeout: AppConfig.HTTP_CLIENT_TIMEOUT,
      retries: 3,
      logger: {
        debug: (message: string, meta?: unknown) => logger.debug(message, meta),
        info: (message: string, meta?: unknown) => logger.info(message, meta),
        warn: (message: string, meta?: unknown) => logger.warn(message, meta),
        error: (message: string, meta?: unknown) => logger.error(message, meta),
      },
    };
    this.httpClient = new ServiceHttpClient(config);
  }

  async getJobById(jobId: string): Promise<JobApiResponse> {
    try {
      const data = await this.httpClient.get<JobApiResponse>(`/api/jobs/${jobId}`);
      return data;
    } catch (error: unknown) {
      logger.error(`JobServiceClient: Error fetching job ${jobId}:`, error);
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
    } catch (error: unknown) {
      logger.error(`JobServiceClient: Error fetching job deadline for ${jobId}:`, error);
      return null;
    }
  }
}

