import { useNavigate } from 'react-router-dom';
import { CreditCard, Crown } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

interface SubscriptionStatusBadgeProps {
  userType: 'user' | 'company';
  className?: string;
}

export const SubscriptionStatusBadge = ({ userType, className = '' }: SubscriptionStatusBadgeProps) => {
  const navigate = useNavigate();
  const { data: status, isLoading: loading } = useSubscriptionStatus(userType);
  
  // Handle loading state
  if (loading) {
    return (
      <div className={`px-3 py-1.5 bg-gray-100 rounded-full ${className}`}>
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }
  
  // Handle case where status is undefined (error or no subscription)
  const currentPlan = status?.plan;
  const isPremium = currentPlan?.name?.toLowerCase() === 'premium' && status?.isActive;
  const isFree = !currentPlan || !status?.isActive || currentPlan.priceMonthly === 0 || currentPlan.priceMonthly === null;
  const planName = currentPlan?.name || 'Free';

  return (
    <button
      onClick={() => navigate(ROUTES.SUBSCRIPTIONS)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all hover:shadow-md ${
        isPremium
          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } ${className}`}
      title={`Current Plan: ${planName}. Click to manage subscription.`}
    >
      {isPremium ? (
        <>
          <Crown className="h-4 w-4" />
          <span className="text-sm font-semibold">Premium</span>
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4" />
          <span className="text-sm font-medium">{planName} Plan</span>
        </>
      )}
    </button>
  );
};

