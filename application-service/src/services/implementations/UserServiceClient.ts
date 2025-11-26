import { injectable } from 'inversify';
import { IUserServiceClient } from '../interfaces/IUserServiceClient';
import { UserApiResponse } from '../../types/external-api.types';
import { logger } from '../../utils/logger';
import { AppConfig } from '../../config/app.config';

@injectable()
export class UserServiceClient implements IUserServiceClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = AppConfig.USER_SERVICE_URL;
  }

  async getUserById(userId: string): Promise<UserApiResponse> {
    try {
      const timeout = AppConfig.HTTP_CLIENT_TIMEOUT; 
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${this.baseUrl}/api/users/${userId}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.warn(`UserServiceClient: Failed to fetch user ${userId}, status: ${response.status}`);
        return {};
      }

      const data = await response.json() as UserApiResponse;
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        logger.error(`UserServiceClient: Request timeout for user ${userId}`);
      } else {
        logger.error(`UserServiceClient: Error fetching user ${userId}:`, error);
      }
      return {};
    }
  }
}

