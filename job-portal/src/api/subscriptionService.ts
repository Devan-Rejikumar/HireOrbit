import api from './axios';

export interface SubscriptionPlan {
  id: string;
  name: string;
  userType: 'user' | 'company';
  priceMonthly: number | null;
  priceYearly: number | null;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  planId: string;
  status: string;
  billingPeriod: 'monthly' | 'yearly';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  plan: SubscriptionPlan;
  features: string[];
}

export interface SubscriptionStatusResponse {
  subscription: Subscription | null;
  isActive: boolean;
  plan: SubscriptionPlan | null;
  features: string[];
}

export interface JobPostingLimit {
  canPost: boolean;
  remaining: number;
  limit: number;
}

export const subscriptionService = {
  // Get available plans
  getPlans: async (userType: 'user' | 'company'): Promise<{ data: SubscriptionPlan[]; message: string }> => {
    const response = await api.get<{ success: boolean; data: { plans: SubscriptionPlan[] }; message: string }>(
      `/subscriptions/plans?userType=${userType}`
    );
    // Backend returns { success: true, data: { plans: [...] }, message: "..." }
    return {
      data: response.data.data?.plans || [],
      message: response.data.message || ''
    };
  },

  // Get subscription status
  getSubscriptionStatus: async (): Promise<{ data: SubscriptionStatusResponse; message: string }> => {
    const response = await api.get<{ data: SubscriptionStatusResponse; message: string }>(
      '/subscriptions/status'
    );
    return response.data;
  },

  // Create subscription (returns either subscription for free plans or checkout URL for paid plans)
  createSubscription: async (planId: string, billingPeriod: 'monthly' | 'yearly'): Promise<{ 
    data: Subscription | { checkoutUrl: string; sessionId: string }; 
    message: string 
  }> => {
    const response = await api.post<{ 
      success: boolean;
      data: Subscription | { checkoutUrl: string; sessionId: string }; 
      message: string 
    }>(
      '/subscriptions',
      { planId, billingPeriod }
    );
    return {
      data: response.data.data,
      message: response.data.message || ''
    };
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId: string): Promise<{ data: Subscription; message: string }> => {
    const response = await api.post<{ data: Subscription; message: string }>(
      `/subscriptions/${subscriptionId}/cancel`
    );
    return response.data;
  },

  // Upgrade subscription
  upgradeSubscription: async (subscriptionId: string, newPlanId: string): Promise<{ data: Subscription; message: string }> => {
    const response = await api.post<{ data: Subscription; message: string }>(
      `/subscriptions/${subscriptionId}/upgrade`,
      { newPlanId }
    );
    return response.data;
  },

  // Check job posting limit (for companies)
  checkJobPostingLimit: async (): Promise<{ data: JobPostingLimit; message: string }> => {
    const response = await api.get<{ data: JobPostingLimit; message: string }>(
      '/subscriptions/limits/job-posting'
    );
    return response.data;
  },

  // Check feature access
  checkFeatureAccess: async (featureName: string): Promise<{ data: { hasAccess: boolean; featureName: string }; message: string }> => {
    const response = await api.get<{ data: { hasAccess: boolean; featureName: string }; message: string }>(
      `/subscriptions/features/${featureName}`
    );
    return response.data;
  }
};
