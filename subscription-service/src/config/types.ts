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
    JobPostingLimitRepository: Symbol.for('JobPostingLimitRepository'),
    IJobPostingLimitRepository: Symbol.for('IJobPostingLimitRepository'),
    
  // Controllers
  SubscriptionController: Symbol.for('SubscriptionController'),
  
  // Webhooks
  StripeWebhookHandler: Symbol.for('StripeWebhookHandler'),
};
  
  export default TYPES;