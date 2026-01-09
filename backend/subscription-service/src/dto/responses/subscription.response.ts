export interface SubscriptionPlanResponse {
  id: string;
  name: string;
  userType: string;
  priceMonthly?: number;
  priceYearly?: number;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionResponse {
  id: string;
  userId?: string;
  companyId?: string;
  planId: string;
  plan?: SubscriptionPlanResponse;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: string;
  billingPeriod: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionStatusResponse {
  subscription: SubscriptionResponse | null;
  plan: SubscriptionPlanResponse | null;
  features: string[];
  isActive: boolean;
}

export interface JobPostingLimitResponse {
  canPost: boolean;
  remaining: number;
  limit: number;
  currentCount?: number;
}

export interface FeatureAccessResponse {
  hasAccess: boolean;
  featureName: string;
}

