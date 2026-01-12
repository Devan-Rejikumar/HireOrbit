import { injectable } from 'inversify';
import { logger } from '../../utils/logger';
import { AppConfig } from '../../config/app.config';
import { ServiceHttpClient, HttpClientConfig } from 'hireorbit-shared-dto';

interface JobCountResponse {
  success?: boolean;
  data?: {
    count?: number;
  };
}

@injectable()
export class JobServiceClient {
  private readonly httpClient: ServiceHttpClient;

  constructor() {
    const config: HttpClientConfig = {
      baseUrl: AppConfig.JOB_SERVICE_URL,
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

  async getCompanyJobCount(companyId: string): Promise<number> {
    try {
      const data = await this.httpClient.get<JobCountResponse>(`/api/jobs/company/${companyId}/count`);
      return data.data?.count || 0;
    } catch (error: unknown) {
      logger.error(`JobServiceClient: Error fetching job count for company ${companyId}:`, error);
      return 0;
    }
  }

  async bulkUpdateJobListing(companyId: string, isListed: boolean): Promise<{ count: number }> {
    try {
      const data = await this.httpClient.patch<{ success: boolean; data: { count: number } }>(
        `/api/jobs/company/${companyId}/bulk-listing`,
        { isListed }
      );
      return data.data || { count: 0 };
    } catch (error: unknown) {
      logger.error(`JobServiceClient: Error bulk updating job listing for company ${companyId}:`, error);
      return { count: 0 };
    }
  }
}

