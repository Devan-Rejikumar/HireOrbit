import { useQuery } from '@tanstack/react-query';
import { subscriptionService, SubscriptionStatusResponse } from '@/api/subscriptionService';

export const useSubscriptionStatus = (userType: 'user' | 'company') => {
  return useQuery<SubscriptionStatusResponse>({
    queryKey: ['subscription-status', userType],
    queryFn: async () => {
      const response = await subscriptionService.getSubscriptionStatus();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
};

