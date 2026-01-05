import { injectable } from 'inversify';
import { AppConfig } from '../../config/app.config';
import { logger } from '../../utils/logger';

@injectable()
export class SubscriptionValidationService {
  async checkSubscriptionStatus(companyId: string, authToken?: string): Promise<{ isValid: boolean; message?: string }> {
    try {
      const subscriptionServiceUrl = AppConfig.SUBSCRIPTION_SERVICE_URL;
      const response = await fetch(
        `${subscriptionServiceUrl}/api/subscriptions/status`,
        {
          method: 'GET',
          headers: {
            'Authorization': authToken || '',
            'x-company-id': companyId,
            'x-user-id': companyId,
            'x-user-role': 'company',
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { message?: string };
        return {
          isValid: false,
          message: errorData.message || 'Failed to verify subscription status',
        };
      }

      const data = await response.json() as { 
        data?: { 
          subscription?: { status?: string } | null;
          isActive?: boolean;
        } 
      };

      const hasSubscription = data.data?.subscription !== null && data.data?.subscription !== undefined;
      const isActive = data.data?.isActive === true;
      
      if (!hasSubscription || !isActive) {
        return {
          isValid: false,
          message: 'You need an active subscription to list jobs. Please subscribe to a plan.',
        };
      }

      return { isValid: true };
    } catch (error) {
      logger.error('Error checking subscription status:', error);
      return {
        isValid: false,
        message: 'Failed to verify subscription status. Please try again.',
      };
    }
  }
}

