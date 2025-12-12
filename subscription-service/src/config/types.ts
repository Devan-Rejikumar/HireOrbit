const TYPES = {
  // Services
  SubscriptionService: Symbol.for('SubscriptionService'),
  ISubscriptionService: Symbol.for('ISubscriptionService'),
  StripeService: Symbol.for('StripeService'),
  IStripeService: Symbol.for('IStripeService'),
  FeatureService: Symbol.for('FeatureService'),
  IFeatureService: Symbol.for('IFeatureService'),
    
  // Repositories
  SubscriptionRepository: Symbol.for('SubscriptionRepository'),
  ISubscriptionRepository: Symbol.for('ISubscriptionRepository'),
  SubscriptionPlanRepository: Symbol.for('SubscriptionPlanRepository'),
  ISubscriptionPlanRepository: Symbol.for('ISubscriptionPlanRepository'),
  TransactionRepository: Symbol.for('TransactionRepository'),
  ITransactionRepository: Symbol.for('ITransactionRepository'),
  JobPostingLimitRepository: Symbol.for('JobPostingLimitRepository'),
  IJobPostingLimitRepository: Symbol.for('IJobPostingLimitRepository'),
    
  // Controllers
  SubscriptionController: Symbol.for('SubscriptionController'),
  AdminSubscriptionController: Symbol.for('AdminSubscriptionController'),
  AdminRevenueController: Symbol.for('AdminRevenueController'),
  
  // Admin Services
  AdminSubscriptionService: Symbol.for('AdminSubscriptionService'),
  IAdminSubscriptionService: Symbol.for('IAdminSubscriptionService'),
  RevenueService: Symbol.for('RevenueService'),
  IRevenueService: Symbol.for('IRevenueService'),
  
  // Webhooks
  StripeWebhookHandler: Symbol.for('StripeWebhookHandler'),
};
  
export default TYPES;