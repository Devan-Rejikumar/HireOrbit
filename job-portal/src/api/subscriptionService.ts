import api from './axios';

export interface SubscriptionFeature {
  id: string;
  name: string;
  planId: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  userType: 'user' | 'company';
  priceMonthly: number | null;
  priceYearly: number | null;
  features: SubscriptionFeature[] | string[];
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
      `/subscriptions/plans?userType=${userType}`,
    );
    // Backend returns { success: true, data: { plans: [...] }, message: "..." }
    return {
      data: response.data.data?.plans || [],
      message: response.data.message || '',
    };
  },

  // Get subscription status
  getSubscriptionStatus: async (): Promise<{ data: SubscriptionStatusResponse; message: string }> => {
    const response = await api.get<{ data: SubscriptionStatusResponse; message: string }>(
      '/subscriptions/status',
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
      { planId, billingPeriod },
    );
    return {
      data: response.data.data,
      message: response.data.message || '',
    };
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId: string): Promise<{ data: Subscription; message: string }> => {
    const response = await api.post<{ data: Subscription; message: string }>(
      `/subscriptions/${subscriptionId}/cancel`,
    );
    return response.data;
  },

  // Upgrade subscription
  upgradeSubscription: async (subscriptionId: string, newPlanId: string): Promise<{ data: Subscription; message: string }> => {
    const response = await api.post<{ data: Subscription; message: string }>(
      `/subscriptions/${subscriptionId}/upgrade`,
      { newPlanId },
    );
    return response.data;
  },

  // Check job posting limit (for companies)
  checkJobPostingLimit: async (): Promise<{ data: JobPostingLimit; message: string }> => {
    const response = await api.get<{ data: JobPostingLimit; message: string }>(
      '/subscriptions/limits/job-posting',
    );
    return response.data;
  },

  // Check feature access
  checkFeatureAccess: async (featureName: string): Promise<{ data: { hasAccess: boolean; featureName: string }; message: string }> => {
    const response = await api.get<{ data: { hasAccess: boolean; featureName: string }; message: string }>(
      `/subscriptions/features/${featureName}`,
    );
    return response.data;
  },

  // Admin methods
  admin: {
    // Get all plans
    getAllPlans: async (page: number = 1, limit: number = 10, userType?: string): Promise<{ 
      data: SubscriptionPlan[]; 
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      message: string;
    }> => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (userType) {
        params.append('userType', userType);
      }

      const response = await api.get<{ 
        success: boolean; 
        data: { 
          plans: SubscriptionPlan[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        }; 
        message: string;
      }>(`/admin/subscriptions/plans?${params.toString()}`);
      return {
        data: response.data.data?.plans || [],
        total: response.data.data?.total || 0,
        page: response.data.data?.page || 1,
        limit: response.data.data?.limit || 10,
        totalPages: response.data.data?.totalPages || 0,
        message: response.data.message || '',
      };
    },

    // Get plan by ID
    getPlanById: async (id: string): Promise<{ data: SubscriptionPlan; message: string }> => {
      const response = await api.get<{ success: boolean; data: { plan: SubscriptionPlan }; message: string }>(
        `/admin/subscriptions/plans/${id}`,
      );
      return {
        data: response.data.data?.plan,
        message: response.data.message || '',
      };
    },

    // Create plan
    createPlan: async (planData: {
      name: string;
      userType: 'user' | 'company';
      priceMonthly?: number;
      priceYearly?: number;
      features?: string[];
      description?: string;
    }): Promise<{ data: SubscriptionPlan; message: string }> => {
      const response = await api.post<{ success: boolean; data: { plan: SubscriptionPlan }; message: string }>(
        '/admin/subscriptions/plans',
        planData,
      );
      return {
        data: response.data.data?.plan,
        message: response.data.message || '',
      };
    },

    // Update plan
    updatePlan: async (id: string, planData: {
      name?: string;
      priceMonthly?: number;
      priceYearly?: number;
      features?: string[];
      description?: string;
    }): Promise<{ data: SubscriptionPlan; message: string }> => {
      const response = await api.put<{ success: boolean; data: { plan: SubscriptionPlan }; message: string }>(
        `/admin/subscriptions/plans/${id}`,
        planData,
      );
      return {
        data: response.data.data?.plan,
        message: response.data.message || '',
      };
    },

    // Update plan price only
    updatePlanPrice: async (id: string, prices: {
      priceMonthly?: number;
      priceYearly?: number;
    }): Promise<{ data: SubscriptionPlan; message: string }> => {
      const response = await api.patch<{ success: boolean; data: { plan: SubscriptionPlan }; message: string }>(
        `/admin/subscriptions/plans/${id}/price`,
        prices,
      );
      return {
        data: response.data.data?.plan,
        message: response.data.message || '',
      };
    },

    // Delete plan
    deletePlan: async (id: string): Promise<{ message: string }> => {
      const response = await api.delete<{ success: boolean; message: string }>(
        `/admin/subscriptions/plans/${id}`,
      );
      return {
        message: response.data.message || '',
      };
    },

    // Get revenue statistics
    getRevenueStatistics: async (startDate?: string, endDate?: string, userType?: 'user' | 'company'): Promise<{
      data: {
        statistics: {
          totalRevenue: number;
          revenueByUserType: {
            user: number;
            company: number;
          };
          revenueByPlan: Array<{
            planId: string;
            planName: string;
            userType: string;
            revenue: number;
          }>;
          revenueByTimePeriod: Array<{
            period: string;
            revenue: number;
          }>;
        };
      };
      message: string;
    }> => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (userType) params.append('userType', userType);
      
      const queryString = params.toString();
      const url = `/admin/subscriptions/revenue${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get<{
        success: boolean;
        data: {
          statistics: {
            totalRevenue: number;
            revenueByUserType: {
              user: number;
              company: number;
            };
            revenueByPlan: Array<{
              planId: string;
              planName: string;
              userType: string;
              revenue: number;
            }>;
            revenueByTimePeriod: Array<{
              period: string;
              revenue: number;
            }>;
          };
        };
        message: string;
      }>(url);
      
      return {
        data: response.data.data,
        message: response.data.message || '',
      };
    },

    // Get transaction history
    getTransactionHistory: async (filters?: {
      userId?: string;
      companyId?: string;
      planId?: string;
      status?: string;
      userType?: 'user' | 'company';
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }): Promise<{
      data: {
        transactions: Array<{
          id: string;
          subscriptionId?: string;
          userId?: string;
          companyId?: string;
          planId: string;
          planName: string;
          userType: string;
          amount: number;
          currency: string;
          status: string;
          billingPeriod: string;
          paymentDate: string;
          stripeInvoiceId?: string;
        }>;
        total: number;
        page: number;
        limit: number;
      };
      message: string;
    }> => {
      const params = new URLSearchParams();
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.companyId) params.append('companyId', filters.companyId);
      if (filters?.planId) params.append('planId', filters.planId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.userType) params.append('userType', filters.userType);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const queryString = params.toString();
      const url = `/admin/subscriptions/transactions${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get<{
        success: boolean;
        data: {
          transactions: Array<{
            id: string;
            subscriptionId?: string;
            userId?: string;
            companyId?: string;
            planId: string;
            planName: string;
            userType: string;
            amount: number;
            currency: string;
            status: string;
            billingPeriod: string;
            paymentDate: string;
            stripeInvoiceId?: string;
          }>;
          total: number;
          page: number;
          limit: number;
        };
        message: string;
      }>(url);
      
      return {
        data: response.data.data,
        message: response.data.message || '',
      };
    },

    // Sync transactions from Stripe
    syncTransactions: async (limit?: number): Promise<{
      data: {
        synced: number;
        skipped: number;
        errors: number;
      };
      message: string;
    }> => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      
      const queryString = params.toString();
      const url = `/admin/subscriptions/transactions/sync${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.post<{
        success: boolean;
        data: {
          synced: number;
          skipped: number;
          errors: number;
        };
        message: string;
      }>(url);
      
      return {
        data: response.data.data,
        message: response.data.message || '',
      };
    },
  },
};
