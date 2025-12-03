import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionService, SubscriptionStatusResponse } from '../../api/subscriptionService';
import { CreditCard, Sparkles, Crown } from 'lucide-react';
import axios from 'axios';

interface SubscriptionStatusBadgeProps {
  userType: 'user' | 'company';
  className?: string;
}

export const SubscriptionStatusBadge = ({ userType, className = '' }: SubscriptionStatusBadgeProps) => {
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getSubscriptionStatus();
      setStatus(response.data);
    } catch (error: any) {
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        // User is not authenticated or doesn't have subscription - treat as free
        setStatus({ subscription: null, isActive: false, plan: null, features: [] });
      } else {
        console.error('Error loading subscription status:', error);
        setStatus({ subscription: null, isActive: false, plan: null, features: [] });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`px-3 py-1.5 bg-gray-100 rounded-full ${className}`}>
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  const currentPlan = status?.plan;
  const isPremium = currentPlan?.name?.toLowerCase() === 'premium' && status?.isActive;
  const isFree = !currentPlan || !status?.isActive || currentPlan.priceMonthly === 0 || currentPlan.priceMonthly === null;
  const planName = currentPlan?.name || 'Free';

  return (
    <button
      onClick={() => navigate('/subscriptions')}
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

