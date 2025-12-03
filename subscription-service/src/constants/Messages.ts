export const Messages = {
  SUBSCRIPTION: {
    CREATED_SUCCESS: 'Subscription created successfully',
    CANCELLED_SUCCESS: 'Subscription cancelled successfully',
    UPDATED_SUCCESS: 'Subscription updated successfully',
    NOT_FOUND: 'Subscription not found',
    ALREADY_EXISTS: 'Subscription already exists',
    INVALID_PLAN: 'Invalid subscription plan',
    INVALID_USER_TYPE: 'Invalid user type',
    UPGRADE_SUCCESS: 'Subscription upgraded successfully',
    DOWNGRADE_SUCCESS: 'Subscription downgraded successfully',
    STATUS_RETRIEVED: 'Subscription status retrieved successfully',
    PLANS_RETRIEVED: 'Subscription plans retrieved successfully',
  },
  FEATURE: {
    ACCESS_DENIED: 'You do not have access to this feature',
    JOB_LIMIT_REACHED: 'You have reached your job posting limit for this month',
    PREMIUM_REQUIRED: 'This feature requires a Premium subscription',
    JOB_LIMIT_RETRIEVED: 'Job posting limit retrieved successfully',
    FEATURE_ACCESS_CHECKED: 'Feature access checked successfully',
  },
  VALIDATION: {
    PLAN_ID_AND_BILLING_REQUIRED: 'Plan ID and billing period are required',
    SUBSCRIPTION_ID_REQUIRED: 'Subscription ID is required',
    SUBSCRIPTION_AND_PLAN_ID_REQUIRED: 'Subscription ID and new plan ID are required',
    FEATURE_NAME_REQUIRED: 'Feature name is required',
    USER_OR_COMPANY_AUTH_REQUIRED: 'User or company must be authenticated',
    COMPANY_AUTH_REQUIRED: 'Company must be authenticated',
  },
  STRIPE: {
    CUSTOMER_CREATION_FAILED: 'Failed to create Stripe customer',
    SUBSCRIPTION_CREATION_FAILED: 'Failed to create Stripe subscription',
    WEBHOOK_VERIFICATION_FAILED: 'Stripe webhook verification failed',
    INVALID_EVENT: 'Invalid Stripe event',
  },
  ERROR: {
    INTERNAL_SERVER_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Validation error',
    UNAUTHORIZED: 'Unauthorized access',
  },
} as const;

