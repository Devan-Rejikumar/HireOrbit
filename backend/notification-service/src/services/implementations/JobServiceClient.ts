import { injectable } from 'inversify';
import { logger } from '../../utils/logger';
import { AppConfig } from '../../config/app.config';
import { ServiceHttpClient, HttpClientConfig } from 'hireorbit-shared-dto';

interface JobResponse {
  success?: boolean;
  data?: {
    job?: {
      title?: string;
      [key: string]: unknown;
    };
    title?: string;
  };
}

@injectable()
export class JobServiceClient {
  private readonly httpClient: ServiceHttpClient;

  constructor() {
    const config: HttpClientConfig = {
      baseUrl: AppConfig.services.jobServiceUrl,
      timeout: 5000,
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

  async getJobById(jobId: string): Promise<JobResponse> {
    try {
      const data = await this.httpClient.get<JobResponse>(`/api/jobs/${jobId}`);
      return data;
    } catch (error: unknown) {
      logger.error(`JobServiceClient: Error fetching job ${jobId}:`, error);
      return {};
    }
  }

  async getJobTitle(jobId: string): Promise<string> {
    try {
      const jobData = await this.getJobById(jobId);
      return jobData.data?.job?.title || jobData.data?.title || 'Job';
    } catch (error: unknown) {
      logger.error(`JobServiceClient: Error fetching job title for ${jobId}:`, error);
      return 'Job';
    }
  }
}

