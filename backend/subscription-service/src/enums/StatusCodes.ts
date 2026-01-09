export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
  INCOMPLETE = 'incomplete',
}

export enum BillingPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum SubscriptionPlanName {
  FREE = 'Free',
  BASIC = 'Basic',
  PREMIUM = 'Premium',
}

export enum UserType {
  USER = 'user',
  COMPANY = 'company',
}

export enum FeatureName {
  ATS_CHECKER = 'ats_checker', 
  UNLIMITED_JOBS = 'unlimited_jobs',
  FEATURED_JOBS = 'featured_jobs',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  USER_PROFILE_SEARCH = 'user_profile_search', 
  COMPANY_ATS_FILTER = 'company_ats_filter', 
  ENHANCED_ANALYTICS = 'enhanced_analytics', 
}

