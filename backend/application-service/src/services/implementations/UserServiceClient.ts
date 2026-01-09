import { injectable } from 'inversify';
import { IUserServiceClient } from '../interfaces/IUserServiceClient';
import { UserApiResponse } from '../../types/external-api.types';
import { logger } from '../../utils/logger';
import { AppConfig } from '../../config/app.config';
import { ServiceHttpClient, HttpClientConfig } from 'hireorbit-shared-dto';

@injectable()
export class UserServiceClient implements IUserServiceClient {
  private readonly httpClient: ServiceHttpClient;

  constructor() {
    const config: HttpClientConfig = {
      baseUrl: AppConfig.USER_SERVICE_URL,
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

  async getUserById(userId: string): Promise<UserApiResponse> {
    try {
      const data = await this.httpClient.get<UserApiResponse>(`/api/users/${userId}`);
      return data;
    } catch (error: unknown) {
      logger.error(`UserServiceClient: Error fetching user ${userId}:`, error);
      return {};
    }
  }
}

