import { injectable } from 'inversify';
import { ICompanyServiceClient, CompanyApiResponse } from '../interfaces/ICompanyServiceClient';
import { logger } from '../../utils/logger';
import { AppConfig } from '../../config/app.config';
import { ServiceHttpClient, HttpClientConfig } from 'hireorbit-shared-dto';

@injectable()
export class CompanyServiceClient implements ICompanyServiceClient {
  private readonly httpClient: ServiceHttpClient;

  constructor() {
    const config: HttpClientConfig = {
      baseUrl: AppConfig.API_GATEWAY_URL || 'http://localhost:4001',
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

  async getCompanyById(companyId: string): Promise<CompanyApiResponse> {
    try {
      const data = await this.httpClient.get<CompanyApiResponse>(`/api/company/${companyId}`);
      return data;
    } catch (error: unknown) {
      logger.error(`CompanyServiceClient: Error fetching company ${companyId}:`, error);
      return {};
    }
  }
}

