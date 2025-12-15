import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { subscriptionService, SubscriptionStatusResponse, SubscriptionPlan } from '../../api/subscriptionService';
import { CreditCard, Sparkles } from 'lucide-react';

interface SubscriptionBannerProps {
  userType: 'user' | 'company';
}

export const SubscriptionBanner = ({ userType }: SubscriptionBannerProps) => {
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [premiumPlan, setPremiumPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSubscriptionData();
  }, [userType]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Load plans first (public endpoint)
      let plansResponse;
      try {
        plansResponse = await subscriptionService.getPlans(userType);
        // Find premium plan - only by name, not by price
        const premium = plansResponse.data.find(plan => 
          plan.name.toLowerCase() === 'premium',
        );
        setPremiumPlan(premium || null);
      } catch (error) {
        console.error('Error loading plans:', error);
        // If plans fail, use default pricing
        setPremiumPlan(null);
      }

      // Try to get subscription status (requires auth)
      try {
        const statusResponse = await subscriptionService.getSubscriptionStatus();
        if (statusResponse?.data) {
          setStatus(statusResponse.data);
        }
      } catch (error: unknown) {
        // If 401/403, user is not authenticated or on free plan - that's okay
        const isAxiosError = error && typeof error === 'object' && 'response' in error;
        const axiosError = isAxiosError ? (error as { response?: { status?: number } }) : null;
        if (axiosError && (axiosError.response?.status === 401 || axiosError.response?.status === 403)) {
          // User is not authenticated or doesn't have subscription - treat as free
          setStatus(null);
        } else {
          console.error('Error loading subscription status:', error);
          setStatus(null);
        }
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  // If status is null (not authenticated or no subscription), treat as free
  const currentPlan = status?.plan || null;
  const isPremium = currentPlan?.name?.toLowerCase() === 'premium' && status?.isActive;
  const isFree = !currentPlan || !status?.isActive || currentPlan.priceMonthly === 0 || currentPlan.priceMonthly === null || currentPlan.priceMonthly === undefined;

  // Show premium success banner if on premium
  if (isPremium) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-1">
                You're on the <span className="text-green-700">Premium Plan</span> 🎉
              </h3>
              <p className="text-green-800 mb-2">
                Enjoy all premium features including:
              </p>
              <ul className="text-sm text-green-700 space-y-1 mb-3">
                {userType === 'user' ? (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span><strong>ATS Score Checker</strong> - Optimize your resume for job applications</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span><strong>Increased Visibility</strong> - Your profile highlighted to recruiters</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span><strong>Premium Badge</strong> - Shows Premium status on your profile</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Unlimited job postings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Featured job listings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>User profile search & ATS-filtered resumes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Advanced analytics dashboard</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={() => navigate(ROUTES.SUBSCRIPTIONS_STATUS)}
              className="px-4 py-2 bg-white border border-green-300 rounded-lg text-green-700 hover:bg-green-50 transition-colors text-sm font-medium"
            >
              Manage Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  const premiumPrice = premiumPlan?.priceMonthly || (userType === 'user' ? 299 : 2299);
  const planName = currentPlan?.name || 'Free';

  return (
    <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-blue-200 rounded-lg p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {isFree ? (
                <>You're currently on the <span className="text-blue-600">{planName} Plan</span></>
              ) : (
                <>You're on the <span className="text-blue-600">{planName} Plan</span></>
              )}
            </h3>
            <p className="text-gray-700 mb-2">
              {userType === 'user' ? (
                <>Upgrade to <span className="font-semibold text-purple-600">Premium</span> for just <span className="font-bold text-blue-600">₹{premiumPrice.toLocaleString('en-IN')}/month</span> and unlock:</>
              ) : (
                <>Upgrade to <span className="font-semibold text-purple-600">Premium</span> for just <span className="font-bold text-blue-600">₹{premiumPrice.toLocaleString('en-IN')}/month</span> and unlock:</>
              )}
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mb-3">
              {userType === 'user' ? (
                <>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span><strong>ATS Score Checker</strong> - Optimize your resume for job applications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span><strong>Increased Visibility</strong> - Your profile highlighted to recruiters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span><strong>Premium Badge</strong> - Shows Premium status on your profile</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Unlimited job postings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Featured job listings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>User profile search & ATS-filtered resumes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Advanced analytics dashboard</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={() => navigate(ROUTES.SUBSCRIPTIONS)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            View Plans
          </button>
          <button
            onClick={() => {
              if (premiumPlan) {
                navigate(`/subscriptions/checkout?planId=${premiumPlan.id}&billingPeriod=monthly`);
              } else {
                navigate(ROUTES.SUBSCRIPTIONS);
              }
            }}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm font-semibold"
          >
            <CreditCard className="h-4 w-4" />
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

