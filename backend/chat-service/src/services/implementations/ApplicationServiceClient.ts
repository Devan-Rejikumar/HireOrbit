import { injectable } from 'inversify';
import { logger } from '../../utils/logger';
import { AppConfig } from '../../config/app.config';
import { ServiceHttpClient, HttpClientConfig } from 'hireorbit-shared-dto';

interface ApplicationResponse {
  success?: boolean;
  data?: {
    application?: {
      userId?: string;
      companyId?: string;
      [key: string]: unknown;
    };
    userId?: string;
    companyId?: string;
  };
  userId?: string;
  companyId?: string;
}

@injectable()
export class ApplicationServiceClient {
  private readonly httpClient: ServiceHttpClient;

  constructor() {
    const config: HttpClientConfig = {
      baseUrl: AppConfig.services.applicationServiceUrl,

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

  async getApplicationById(applicationId: string): Promise<ApplicationResponse> {
    try {
      const data = await this.httpClient.get<ApplicationResponse>(`/api/applications/${applicationId}`);
      return data;
    } catch (error: unknown) {
      logger.error(`ApplicationServiceClient: Error fetching application ${applicationId}:`, error);
      return {};
    }
  }
}

