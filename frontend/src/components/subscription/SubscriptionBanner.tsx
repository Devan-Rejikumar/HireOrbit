import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { subscriptionService, SubscriptionStatusResponse, SubscriptionPlan } from '../../api/subscriptionService';
import { CreditCard, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

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
          setStatus(null);
        }
      }
    } catch (error) {
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
  const subscription = status?.subscription;
  
  // Check if subscription has expired
  let hasExpired = false;
  if (subscription && subscription.currentPeriodEnd) {
    const expiryDate = new Date(subscription.currentPeriodEnd);
    const now = new Date();
    hasExpired = expiryDate <= now;
  }
  
  const isPremium = currentPlan?.name?.toLowerCase() === 'premium' && status?.isActive && !hasExpired;
  const isExpiredPremium = currentPlan?.name?.toLowerCase() === 'premium' && hasExpired;
  const isFree = !currentPlan || (!status?.isActive && !isExpiredPremium) || currentPlan.priceMonthly === 0 || currentPlan.priceMonthly === null || currentPlan.priceMonthly === undefined;

  // Show expired premium banner
  if (isExpiredPremium && subscription) {
    const expiryDate = new Date(subscription.currentPeriodEnd);
    return (
      <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-2 border-red-300 rounded-xl md:rounded-2xl p-4 md:p-6 mb-6 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6">
          <div className="flex items-start gap-3 md:gap-5 flex-1 w-full">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 border border-red-300 rounded-full mb-2 md:mb-3">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Subscription Expired</span>
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-1 md:mb-2 leading-tight">
                Your <span className="text-red-600">Premium Plan</span> has expired
              </h3>
              <p className="text-sm md:text-base text-gray-700 mb-2">
                Your subscription expired on <span className="font-semibold">{expiryDate.toLocaleDateString()}</span>
              </p>
              <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">
                Renew your subscription to continue enjoying premium features:
              </p>
              <ul className="space-y-2 md:space-y-2.5">
                {userType === 'user' ? (
                  <>
                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-bold text-xs md:text-sm">✓</span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-900 text-sm md:text-base">ATS Score Checker</span>
                        <span className="text-gray-600 text-xs md:text-sm"> - Optimize your resume for job applications</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-bold text-xs md:text-sm">✓</span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-900 text-sm md:text-base">Increased Visibility</span>
                        <span className="text-gray-600 text-xs md:text-sm"> - Your profile highlighted to recruiters</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-bold text-xs md:text-sm">✓</span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-900 text-sm md:text-base">Premium Badge</span>
                        <span className="text-gray-600 text-xs md:text-sm"> - Shows Premium status on your profile</span>
                      </div>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-bold text-xs md:text-sm">✓</span>
                      </div>
                      <span className="text-gray-700 text-sm md:text-base">Unlimited job postings</span>
                    </li>
                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-bold text-xs md:text-sm">✓</span>
                      </div>
                      <span className="text-gray-700 text-sm md:text-base">Featured job listings</span>
                    </li>
                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-bold text-xs md:text-sm">✓</span>
                      </div>
                      <span className="text-gray-700 text-sm md:text-base break-words">User profile search & ATS-filtered resumes</span>
                    </li>
                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-bold text-xs md:text-sm">✓</span>
                      </div>
                      <span className="text-gray-700 text-sm md:text-base">Advanced analytics dashboard</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="flex-shrink-0 w-full lg:w-auto">
            <button
              onClick={() => {
                if (premiumPlan) {
                  navigate(`/subscriptions/checkout?planId=${premiumPlan.id}&billingPeriod=monthly`);
                } else {
                  navigate(ROUTES.SUBSCRIPTIONS);
                }
              }}
              className="w-full lg:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg md:rounded-xl hover:from-red-700 hover:to-orange-700 hover:shadow-md transition-all duration-200 font-semibold text-xs md:text-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4 md:h-5 md:w-5" />
              <span>Renew Subscription</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show premium success banner if on premium
  if (isPremium) {
    return (
      <div className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-300 rounded-xl md:rounded-2xl p-4 md:p-6 mb-6 shadow-lg overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-20 h-20 md:w-32 md:h-32 bg-emerald-200/20 rounded-full blur-2xl md:blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 md:w-24 md:h-24 bg-teal-200/20 rounded-full blur-xl md:blur-2xl"></div>
        
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6">
          <div className="flex items-start gap-3 md:gap-5 flex-1 w-full">
            {/* Icon with enhanced styling */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-[10px] md:text-xs">⭐</span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-0.5 md:py-1 bg-emerald-100 border border-emerald-300 rounded-full mb-2 md:mb-3">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] md:text-xs font-semibold text-emerald-700 uppercase tracking-wide">Premium Active</span>
              </div>
              
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-1 md:mb-2 leading-tight">
                You're on the <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Premium Plan</span> 🎉
              </h3>
              <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4 font-medium">
                Enjoy all premium features including:
              </p>
              <ul className="space-y-2 md:space-y-2.5">
                {userType === 'user' ? (
                  <>
                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-600 font-bold text-xs md:text-sm">✓</span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-900 text-sm md:text-base">ATS Score Checker</span>
                        <span className="text-gray-600 text-xs md:text-sm"> - Optimize your resume for job applications</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-600 font-bold text-xs md:text-sm">✓</span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-900 text-sm md:text-base">Increased Visibility</span>
                        <span className="text-gray-600 text-xs md:text-sm"> - Your profile highlighted to recruiters</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-600 font-bold text-xs md:text-sm">✓</span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-900 text-sm md:text-base">Premium Badge</span>
                        <span className="text-gray-600 text-xs md:text-sm"> - Shows Premium status on your profile</span>
                      </div>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-600 font-bold text-xs md:text-sm">✓</span>
                      </div>
                      <span className="text-gray-700 text-sm md:text-base">Unlimited job postings</span>
                    </li>
                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-600 font-bold text-xs md:text-sm">✓</span>
                      </div>
                      <span className="text-gray-700 text-sm md:text-base">Featured job listings</span>
                    </li>
                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-600 font-bold text-xs md:text-sm">✓</span>
                      </div>
                      <span className="text-gray-700 text-sm md:text-base break-words">User profile search & ATS-filtered resumes</span>
                    </li>
                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-600 font-bold text-xs md:text-sm">✓</span>
                      </div>
                      <span className="text-gray-700 text-sm md:text-base">Advanced analytics dashboard</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
          
          {/* Button with enhanced styling */}
          <div className="flex-shrink-0 w-full lg:w-auto">
            <button
              onClick={() => navigate(ROUTES.SUBSCRIPTIONS_STATUS)}
              className="w-full lg:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-white border-2 border-emerald-400 rounded-lg md:rounded-xl text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500 hover:shadow-md transition-all duration-200 font-semibold text-xs md:text-sm flex items-center justify-center gap-2 group"
            >
              <span>Manage Plan</span>
              <svg className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const premiumPrice = premiumPlan?.priceMonthly || (userType === 'user' ? 299 : 2299);
  const planName = currentPlan?.name || 'Free';

  return (
    <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-blue-200 rounded-lg md:rounded-xl p-4 md:p-6 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6">
        <div className="flex items-start gap-3 md:gap-4 flex-1 w-full">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 leading-tight">
              <>You're currently on the <span className="text-blue-600">{planName} Plan</span></>
            </h3>
            <p className="text-sm md:text-base text-gray-700 mb-2">
              {userType === 'user' ? (
                <>Upgrade to <span className="font-semibold text-purple-600">Premium</span> for just <span className="font-bold text-blue-600">₹{premiumPrice.toLocaleString('en-IN')}/month</span> and unlock:</>
              ) : (
                <>Upgrade to <span className="font-semibold text-purple-600">Premium</span> for just <span className="font-bold text-blue-600">₹{premiumPrice.toLocaleString('en-IN')}/month</span> and unlock:</>
              )}
            </p>
            <ul className="text-xs md:text-sm text-gray-600 space-y-1 mb-3">
              {userType === 'user' ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span className="break-words"><strong>ATS Score Checker</strong> - Optimize your resume for job applications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span className="break-words"><strong>Increased Visibility</strong> - Your profile highlighted to recruiters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span className="break-words"><strong>Premium Badge</strong> - Shows Premium status on your profile</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span className="break-words">Unlimited job postings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span className="break-words">Featured job listings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span className="break-words">User profile search & ATS-filtered resumes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span className="break-words">Advanced analytics dashboard</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 flex-shrink-0 w-full lg:w-auto">
          <button
            onClick={() => navigate(ROUTES.SUBSCRIPTIONS)}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-xs md:text-sm font-medium"
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
            className="w-full sm:w-auto px-4 md:px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-xs md:text-sm font-semibold"
          >
            <CreditCard className="h-3 w-3 md:h-4 md:w-4" />
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

