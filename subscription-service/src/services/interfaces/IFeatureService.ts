export interface IFeatureService {
  checkJobPostingLimit(companyId: string): Promise<{ canPost: boolean; remaining: number; limit: number }>;
  canPostFeaturedJob(companyId: string): Promise<boolean>;
  canAccessATSChecker(userId: string): Promise<boolean>;
  incrementJobPostingCount(companyId: string): Promise<void>;
  checkFeatureAccess(userId: string | undefined, companyId: string | undefined, featureName: string): Promise<boolean>;
}

