import { injectable, inject } from 'inversify';
import TYPES from '../../config/types';
import { IFeatureService } from '../interfaces/IFeatureService';
import { ISubscriptionService } from '../interfaces/ISubscriptionService';
import { IJobPostingLimitRepository } from '../../repositories/interfaces/IJobPostingLimitRepository';
import { FeatureName } from '../../enums/StatusCodes';
// Logger removed - using console.log instead

@injectable()
export class FeatureService implements IFeatureService {
  constructor(
    @inject(TYPES.ISubscriptionService)
    private readonly _subscriptionService: ISubscriptionService,
    @inject(TYPES.IJobPostingLimitRepository)
    private readonly _jobPostingLimitRepository: IJobPostingLimitRepository,
  ) {}

  async checkJobPostingLimit(companyId: string): Promise<{ canPost: boolean; remaining: number; limit: number }> {
    try {
      const subscriptionStatus = await this._subscriptionService.getSubscriptionStatus(undefined, companyId);
      
      if (!subscriptionStatus.subscription || !subscriptionStatus.isActive) {
        // Default to Free plan limits if no active subscription
        const limit = 3;
        const limitRecord = await this._jobPostingLimitRepository.findByCompanyId(companyId);
        const currentCount = limitRecord?.currentCount || 0;
        
        return {
          canPost: currentCount < limit,
          remaining: Math.max(0, limit - currentCount),
          limit,
        };
      }

      const plan = subscriptionStatus.plan;
      if (!plan) {
        throw new Error('Plan not found for subscription');
      }

      // Check if plan has unlimited jobs feature
      const hasUnlimitedJobs = subscriptionStatus.features.includes(FeatureName.UNLIMITED_JOBS);
      
      if (hasUnlimitedJobs) {
        return {
          canPost: true,
          remaining: Infinity,
          limit: Infinity,
        };
      }

      // Get or create job posting limit record
      let limitRecord = await this._jobPostingLimitRepository.findByCompanyId(companyId);
      
      // Determine limit based on plan name
      let limit = 3; // Default Free plan
      if (plan.name === 'Basic') {
        limit = 10;
      } else if (plan.name === 'Premium') {
        limit = Infinity;
      }

      if (!limitRecord) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        
        limitRecord = await this._jobPostingLimitRepository.create({
          companyId,
          currentCount: 0,
          limit,
          resetDate: nextMonth,
        });
      } else {
        // Update limit if plan changed
        if (limitRecord.limit !== limit) {
          limitRecord = await this._jobPostingLimitRepository.update(companyId, { limit });
        }
      }

      const currentCount = limitRecord.currentCount;
      const canPost = limit === Infinity || currentCount < limit;

      return {
        canPost,
        remaining: limit === Infinity ? Infinity : Math.max(0, limit - currentCount),
        limit,
      };
    } catch (error) {
      console.error('Error checking job posting limit', { error, companyId });
      throw error;
    }
  }

  async canPostFeaturedJob(companyId: string): Promise<boolean> {
    try {
      const subscriptionStatus = await this._subscriptionService.getSubscriptionStatus(undefined, companyId);
      
      if (!subscriptionStatus.isActive || !subscriptionStatus.plan) {
        return false;
      }

      return subscriptionStatus.features.includes(FeatureName.FEATURED_JOBS);
    } catch (error) {
      console.error('Error checking featured job access', { error, companyId });
      return false;
    }
  }

  async canAccessATSChecker(userId: string): Promise<boolean> {
    try {
      const subscriptionStatus = await this._subscriptionService.getSubscriptionStatus(userId);
      
      if (!subscriptionStatus.isActive || !subscriptionStatus.plan) {
        return false;
      }

      return subscriptionStatus.features.includes(FeatureName.ATS_CHECKER);
    } catch (error) {
      console.error('Error checking ATS checker access', { error, userId });
      return false;
    }
  }

  async incrementJobPostingCount(companyId: string): Promise<void> {
    try {
      const limitRecord = await this._jobPostingLimitRepository.findByCompanyId(companyId);
      
      if (limitRecord) {
        await this._jobPostingLimitRepository.incrementCount(companyId);
      } else {
        // Create if doesn't exist (shouldn't happen, but handle gracefully)
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        
        await this._jobPostingLimitRepository.create({
          companyId,
          currentCount: 1,
          limit: 3, // Default
          resetDate: nextMonth,
        });
      }
    } catch (error) {
      console.error('Error incrementing job posting count', { error, companyId });
      throw error;
    }
  }

  async checkFeatureAccess(userId: string | undefined, companyId: string | undefined, featureName: string): Promise<boolean> {
    try {
      const subscriptionStatus = await this._subscriptionService.getSubscriptionStatus(userId, companyId);
      
      if (!subscriptionStatus.isActive || !subscriptionStatus.plan) {
        return false;
      }

      return subscriptionStatus.features.includes(featureName);
    } catch (error) {
      console.error('Error checking feature access', { error, userId, companyId, featureName });
      return false;
    }
  }
}

