import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { subscriptionService, SubscriptionPlan, SubscriptionFeature } from '../api/subscriptionService';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { MESSAGES } from '@/constants/messages';
import { 
  Home, 
  User, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut,
  Search,
  CreditCard,
  Check,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { MessagesDropdown } from '@/components/MessagesDropdown';
import { useTotalUnreadCount } from '@/hooks/useChat';
import { useState } from 'react';

export const CheckoutPage = () => {
  const { role, user, company, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get('planId');
  const billingPeriod = searchParams.get('billingPeriod') as 'monthly' | 'yearly' | null;
  
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Automatically determine userType based on role
  const userType: 'user' | 'company' = role === 'company' ? 'company' : 'user';

  // Get total unread message count
  const { data: totalUnreadMessages = 0 } = useTotalUnreadCount(
    role === 'jobseeker' ? user?.id || null : company?.id || null,
  );

  useEffect(() => {
    if (!planId) {
      toast.error(MESSAGES.ERROR.INVALID_PLAN_SELECTION);
      navigate(ROUTES.SUBSCRIPTIONS);
      return;
    }
    loadPlan();
  }, [planId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getPlans(userType);
      const selectedPlan = response.data.find(p => p.id === planId);
      
      if (!selectedPlan) {
        toast.error(MESSAGES.ERROR.PLAN_NOT_FOUND);
        navigate(ROUTES.SUBSCRIPTIONS);
        return;
      }
      
      setPlan(selectedPlan);
    } catch (error) {
      toast.error(MESSAGES.ERROR.PLAN_DETAILS_LOAD_FAILED);
      navigate(ROUTES.SUBSCRIPTIONS);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!planId) return;

    try {
      setProcessing(true);
      const response = await subscriptionService.createSubscription(planId, 'monthly');
      
      // Check if response contains checkout URL (paid plan) or subscription (free plan)
      if (response.data && 'checkoutUrl' in response.data && response.data.checkoutUrl) {
        // Redirect to Stripe Checkout for paid plans
        window.location.href = response.data.checkoutUrl;
        return;
      }
      
      // For free plans, subscription is created directly
      navigate(ROUTES.SUBSCRIPTIONS_STATUS);
    } catch (error: unknown) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { data?: { message?: string } } }) : null;
      toast.error(axiosError?.response?.data?.message || 'Failed to create subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME, { replace: true });
  };

  // Sidebar items based on role
  const sidebarItems = role === 'company' 
    ? [
      { id: 'dashboard', label: 'Dashboard', icon: Home, path: ROUTES.COMPANY_DASHBOARD },
      { id: 'jobs', label: 'My Jobs', icon: Briefcase, path: '/company/jobs' },
      { id: 'applications', label: 'Applications', icon: User, path: '/company/applications' },
      { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/messages', badge: totalUnreadMessages },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/company/settings' },
    ]
    : [
      { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/user/dashboard' },
      { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
      { id: 'applied-jobs', label: 'Applied Jobs', icon: Briefcase, path: '/applied-jobs' },
      { id: 'schedule', label: 'My Schedule', icon: Calendar, path: '/schedule' },
      { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/messages', badge: totalUnreadMessages },
    ];

  const handleSidebarClick = (item: typeof sidebarItems[0]) => {
    setIsMobileMenuOpen(false);
    if (item.path) {
      navigate(item.path);
    }
  };

  // Helper function to extract feature name (handles both string and SubscriptionFeature)
  const getFeatureName = (feature: string | SubscriptionFeature): string => {
    return typeof feature === 'string' ? feature : feature.name;
  };

  // Get display features - for User Premium, add implicit features
  const getDisplayFeatures = (plan: SubscriptionPlan) => {
    if (userType === 'user' && plan.name.toLowerCase() === 'premium') {
      return [
        'ATS Score Checker - Optimize your resume for job applications',
        'Increased Visibility - Your profile highlighted to recruiters',
        'Premium Badge - Shows Premium status on your profile',
      ];
    }
    
    // For other plans, format the actual features
    return plan.features.map(feature => {
      const featureName = getFeatureName(feature);
      const formatted = featureName
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l: string) => l.toUpperCase())
        .replace(/Ats/g, 'ATS');
      
      // Add descriptions for common features
      if (featureName === 'ats_checker') {
        return 'ATS Score Checker - Optimize your resume for job applications';
      }
      if (featureName === 'unlimited_jobs') {
        return 'Unlimited job postings';
      }
      if (featureName === 'featured_jobs') {
        return 'Featured job listings';
      }
      if (featureName === 'user_profile_search') {
        return 'User profile search';
      }
      if (featureName === 'company_ats_filter') {
        return 'ATS-filtered resumes';
      }
      if (featureName === 'enhanced_analytics') {
        return 'Enhanced analytics';
      }
      if (featureName === 'advanced_analytics') {
        return 'Advanced analytics';
      }
      return formatted;
    });
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined || typeof price !== 'number') return 'Free';
    return `₹${price.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plan details...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Plan not found</p>
          <button
            onClick={() => navigate('/subscriptions')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Plans
          </button>
        </div>
      </div>
    );
  }

  const isFreePlan = plan.priceMonthly === null || plan.priceMonthly === undefined || plan.priceMonthly === 0;
  const price = plan.priceMonthly;
  const formattedPrice = formatPrice(price);
  const displayFeatures = getDisplayFeatures(plan);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <button
                onClick={() => navigate('/subscriptions')}
                className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                title="Back to Plans"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Checkout</h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => navigate(ROUTES.JOBS)} 
                className="hidden sm:block p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Search Jobs"
              >
                <Search className="h-5 w-5" />
              </button>
              
              <NotificationBell />
              
              {(user?.id || company?.id) && (
                <div className="hidden sm:block">
                  <MessagesDropdown userId={user?.id || company?.id || ''} />
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-2 sm:px-3"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-0 lg:top-16 left-0 z-40 lg:z-0
          w-72 lg:w-64 bg-white shadow-lg lg:shadow-sm border-r border-gray-200 
          h-screen lg:h-[calc(100vh-4rem)] overflow-y-auto 
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="p-4 sm:p-6 pt-6">
            {/* Mobile: User Info at top */}
            <div className="lg:hidden mb-6">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold">
                    {role === 'company' 
                      ? company?.companyName?.charAt(0).toUpperCase() || 'C'
                      : user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {role === 'company' ? company?.companyName || 'Company' : user?.username || 'User'}
                  </div>
                  <div className="text-xs text-blue-600 truncate">
                    {role === 'company' ? company?.email || '' : user?.email || ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1 mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Main</h3>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = window.location.pathname === item.path;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSidebarClick(item)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Subscription</h3>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); navigate('/subscriptions'); }}
                className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-700 font-medium rounded-lg w-full text-left transition-all duration-200"
              >
                <CreditCard className="h-5 w-5" />
                Plans & Pricing
              </button>
            </div>

            {/* Desktop: User Info at Bottom */}
            <div className="hidden lg:block mt-8">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold">
                    {role === 'company' 
                      ? company?.companyName?.charAt(0).toUpperCase() || 'C'
                      : user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {role === 'company' ? company?.companyName || 'Company' : user?.username || 'User'}
                  </div>
                  <div className="text-xs text-blue-600 truncate">
                    {role === 'company' ? company?.email || '' : user?.email || ''}
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Complete Your Subscription</h1>
              <p className="text-sm sm:text-base text-gray-600">Review your plan details and confirm your subscription</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Plan Summary Card */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{plan.name} Plan</h2>
                      <p className="text-gray-600 text-xs sm:text-sm">
                        {plan.name.toLowerCase() === 'free' 
                          ? 'Perfect for getting started'
                          : plan.name.toLowerCase() === 'basic'
                            ? 'Ideal for small businesses'
                            : 'For fast-growing businesses'}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-3xl sm:text-4xl font-bold text-gray-900">{formattedPrice}</div>
                      {!isFreePlan && (
                        <div className="text-xs sm:text-sm text-gray-600">/Monthly</div>
                      )}
                      {isFreePlan && (
                        <div className="text-xs sm:text-sm text-gray-600">Forever free</div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 sm:pt-6">
                    <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Features included:</h3>
                    <ul className="space-y-2 sm:space-y-3">
                      {displayFeatures.length > 0 ? (
                        displayFeatures.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 leading-relaxed text-sm sm:text-base">{feature}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500 text-sm">Basic features included</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Order Summary Card */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm lg:sticky lg:top-24">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Order Summary</h3>
                  
                  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-gray-600">Plan:</span>
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">{plan.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-gray-600">Billing:</span>
                      <span className="font-semibold text-gray-900 capitalize text-sm sm:text-base">Monthly</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-base sm:text-lg font-semibold text-gray-900">Total:</span>
                        <span className="text-xl sm:text-2xl font-bold text-purple-600">{formattedPrice}</span>
                      </div>
                      {!isFreePlan && (
                        <p className="text-xs text-gray-500 mt-1">Charged monthly</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <button
                      onClick={handleSubscribe}
                      disabled={processing || isFreePlan}
                      className={`w-full py-2.5 sm:py-3 px-4 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                        processing || isFreePlan
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {processing ? 'Processing...' : isFreePlan ? 'Free Plan' : 'Subscribe Now'}
                    </button>
                    <button
                      onClick={() => navigate('/subscriptions')}
                      className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  </div>

                  {isFreePlan && (
                    <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        This is a free plan. No payment required.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      By subscribing, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
