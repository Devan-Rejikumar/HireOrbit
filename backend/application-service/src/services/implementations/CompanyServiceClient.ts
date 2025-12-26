import { injectable } from 'inversify';
import { ICompanyServiceClient, CompanyApiResponse } from '../interfaces/ICompanyServiceClient';
import { logger } from '../../utils/logger';
import { AppConfig } from '../../config/app.config';

@injectable()
export class CompanyServiceClient implements ICompanyServiceClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = AppConfig.API_GATEWAY_URL || 'http://localhost:4001';
  }

  async getCompanyById(companyId: string): Promise<CompanyApiResponse> {
    try {
      const timeout = AppConfig.HTTP_CLIENT_TIMEOUT; 
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${this.baseUrl}/api/company/${companyId}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.warn(`CompanyServiceClient: Failed to fetch company ${companyId}, status: ${response.status}`);
        return {};
      }

      const data = await response.json() as CompanyApiResponse;
      return data;
    } catch (error: unknown) {
      const err = error as { name?: string };
      if (err.name === 'AbortError') {
        logger.error(`CompanyServiceClient: Request timeout for company ${companyId}`);
      } else {
        logger.error(`CompanyServiceClient: Error fetching company ${companyId}:`, error);
      }
      return {};
    }
  }
}

