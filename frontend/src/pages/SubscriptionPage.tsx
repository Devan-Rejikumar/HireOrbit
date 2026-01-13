import { useEffect, useState, useCallback } from 'react';
import { subscriptionService, SubscriptionPlan } from '../api/subscriptionService';
import { SubscriptionCard } from '../components/subscription/SubscriptionCard';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  User, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut,
  CreditCard,
  Building2,
  Calendar as CalendarIcon,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTotalUnreadCount } from '@/hooks/useChat';
import { CompanyHeader } from '@/components/CompanyHeader';
import { Logo } from '@/components/Logo';
import api from '@/api/axios';

interface CompanyProfile {
  id: string;
  companyName?: string;
  email?: string;
  profileCompleted?: boolean;
  isVerified?: boolean;
  logo?: string;
}

export const SubscriptionPage = () => {
  const { role, user, company: authCompany, logout } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Automatically determine userType based on role
  const userType: 'user' | 'company' = role === 'company' ? 'company' : 'user';

  // Get total unread message count
  const { data: totalUnreadMessages = 0 } = useTotalUnreadCount(
    role === 'jobseeker' ? user?.id || null : (company?.id || authCompany?.id || null),
  );

  const fetchCompanyProfile = useCallback(async () => {
    try {
      const response = await api.get<{
        data?: { company?: CompanyProfile };
        company?: CompanyProfile;
      }>('/company/profile');
      let companyData: CompanyProfile | null = null;
      
      if (response.data && response.data.data && response.data.data.company) {
        companyData = response.data.data.company;
      } else if (response.data && response.data.company) {
        companyData = response.data.company;
      }
      
      setCompany(companyData);
    } catch (_error) {
      // Fallback to auth company if available
      if (authCompany) {
        setCompany({
          id: authCompany.id,
          companyName: authCompany.companyName,
          email: authCompany.email,
          profileCompleted: authCompany.profileCompleted,
          isVerified: authCompany.isVerified,
        });
      }
    }
  }, [authCompany]);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getPlans(userType);
      // Show all plans including Free
      setPlans(response.data || []);
    } catch (_error) {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [userType]);

  const loadCurrentSubscription = useCallback(async () => {
    try {
      const response = await subscriptionService.getSubscriptionStatus();
      const subscription = response.data?.subscription;
      // Only set currentPlanId if subscription is active and not expired
      // This allows selection for cancelled/expired subscriptions
      if (subscription && response.data.isActive && subscription) {
        setCurrentPlanId(subscription.planId);
      } else {
        setCurrentPlanId(null); // Allow selection for cancelled/expired
      }
    } catch (_error) {
      // No active subscription found
      setCurrentPlanId(null);
    }
  }, []);

  useEffect(() => {
    if (role) {
      loadPlans();
      loadCurrentSubscription();
    }
  }, [role, loadPlans, loadCurrentSubscription]);

  useEffect(() => {
    if (role === 'company') {
      fetchCompanyProfile();
    }
  }, [role, fetchCompanyProfile]);

  const handleSelectPlan = async (planId: string, billingPeriod: 'monthly' | 'yearly') => {
    // Navigate to checkout page with planId and billingPeriod as query parameters
    navigate(`${ROUTES.SUBSCRIPTIONS_CHECKOUT}?planId=${planId}&billingPeriod=${billingPeriod}`);
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

  // Determine which plan is "most popular" - Premium is always most popular
  const getPopularPlanIndex = () => {
    if (plans.length === 0) return -1;
    const premiumIndex = plans.findIndex(p => p.name.toLowerCase() === 'premium');
    return premiumIndex !== -1 ? premiumIndex : -1;
  };

  const popularPlanIndex = getPopularPlanIndex();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-700">Loading plans...</h3>
          <p className="text-gray-500">Please wait while we fetch your subscription plans</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view subscription plans.</p>
          <button
            onClick={() => navigate(ROUTES.LOGIN)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {role === 'company' ? (
        <CompanyHeader company={company} onLogout={handleLogout} />
      ) : (
        <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 fixed top-0 left-0 right-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-8">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              {/* Company Logo */}
              <Logo size="md" textClassName="text-gray-900 hidden sm:block" iconClassName="bg-gradient-to-br from-purple-600 to-indigo-600" fallbackIcon="letter" />
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Logout Button */}
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
        </header>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex min-h-screen relative pt-14 sm:pt-16">
        {/* Sidebar */}
        {role === 'company' ? (
          <aside className={`
            fixed lg:sticky top-14 sm:top-16 left-0 z-40 lg:z-0
            w-72 lg:w-64 bg-white shadow-lg lg:shadow-sm border-r border-gray-200 
            h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-y-auto 
            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
            transform transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <nav className="p-4 sm:p-6">
              {/* Mobile: Company Info at top */}
              <div className="lg:hidden mb-6 pt-2">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                  {company?.logo ? (
                    <img 
                      src={company.logo} 
                      alt={company.companyName || 'Company logo'} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-purple-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{company?.companyName || 'Company'}</div>
                    <div className="text-xs text-purple-600 truncate">{company?.email || 'email@company.com'}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-1 mb-8">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Main</h3>
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); navigate(ROUTES.COMPANY_DASHBOARD); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-all duration-200 ${
                    location.pathname === ROUTES.COMPANY_DASHBOARD
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Home className="h-5 w-5" />
                  Dashboard
                </button>
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); navigate(ROUTES.CHAT); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left relative transition-all duration-200 ${
                    location.pathname === ROUTES.CHAT
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="flex-1">Messages</span>
                  {totalUnreadMessages > 0 && (
                    <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); navigate(ROUTES.COMPANY_DASHBOARD); }} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-all duration-200 ${
                    location.pathname === ROUTES.COMPANY_DASHBOARD
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                  Company Profile
                </button>
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); navigate(ROUTES.COMPANY_APPLICATIONS); }} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-all duration-200 ${
                    location.pathname === ROUTES.COMPANY_APPLICATIONS
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-5 w-5" />
                  All Applicants
                </button>
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); navigate(ROUTES.COMPANY_JOBS); }} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-all duration-200 ${
                    location.pathname === ROUTES.COMPANY_JOBS
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Briefcase className="h-5 w-5" />
                  Job Listing
                </button>
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); navigate(ROUTES.COMPANY_INTERVIEWS); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-all duration-200 ${
                    location.pathname === ROUTES.COMPANY_INTERVIEWS
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CalendarIcon className="h-5 w-5" />
                  Interview Management
                </button>
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); navigate(ROUTES.SUBSCRIPTIONS); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-all duration-200 ${
                    location.pathname === ROUTES.SUBSCRIPTIONS
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  Plans & Billing
                </button>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Setting</h3>
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); navigate(ROUTES.COMPANY_SETTINGS); }} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-all duration-200 ${
                    location.pathname === ROUTES.COMPANY_SETTINGS
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </button>
              </div>
              
              {/* Desktop: Company Info at bottom */}
              <div className="hidden lg:block mt-8">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100 hover:shadow-md transition-all duration-300">
                  {company?.logo ? (
                    <img 
                      src={company.logo} 
                      alt={company.companyName || 'Company logo'} 
                      className="w-8 h-8 rounded-full object-cover border-2 border-purple-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{company?.companyName || 'Company'}</div>
                    <div className="text-xs text-purple-600">{company?.email || 'email@company.com'}</div>
                  </div>
                </div>
              </div>
            </nav>
          </aside>
        ) : (
          <aside className={`
            fixed lg:sticky top-14 sm:top-16 left-0 z-40 lg:z-0
            w-72 lg:w-64 bg-white shadow-lg lg:shadow-sm border-r border-gray-200 
            h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-y-auto 
            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
            transform transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <nav className="p-4 sm:p-6">
              {/* Mobile: User Info at top */}
              <div className="lg:hidden mb-6 pt-2">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{user?.username || 'User'}</div>
                    <div className="text-xs text-purple-600 truncate">{user?.email || 'email@user.com'}</div>
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
                          ? 'bg-purple-50 text-purple-700 font-medium'
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
                  onClick={() => { setIsMobileMenuOpen(false); navigate(ROUTES.SUBSCRIPTIONS); }}
                  className="flex items-center gap-3 px-3 py-2.5 bg-purple-50 text-purple-700 font-medium rounded-lg w-full text-left transition-all duration-200"
                >
                  <CreditCard className="h-5 w-5" />
                  Plans & Billing
                </button>
              </div>
              
              {/* Desktop: User Info at bottom */}
              <div className="hidden lg:block mt-8">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100 hover:shadow-md transition-all duration-300">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user?.username || 'User'}</div>
                    <div className="text-xs text-purple-600">{user?.email || 'email@user.com'}</div>
                  </div>
                </div>
              </div>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 min-w-0">
          <div className="h-full flex flex-col justify-center">
            <div className="w-full max-w-6xl mx-auto">
              {/* Page Title and Description */}
              <div className="text-center mb-4 sm:mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Plans & Pricing</h1>
                <p className="text-gray-600 max-w-2xl mx-auto text-xs md:text-sm">
                  Choose the plan that fits your needs. All plans include essential features to get you started.
                </p>
              </div>

              {/* Plans Grid */}
              {plans.length > 0 ? (
                <div className={`grid gap-4 w-full ${
                  plans.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                    plans.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' :
                      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}>
                  {plans.map((plan, index) => (
                    <SubscriptionCard
                      key={plan.id}
                      plan={plan}
                      currentPlan={currentPlanId || undefined}
                      onSelect={handleSelectPlan}
                      userType={userType}
                      isPopular={index === popularPlanIndex}
                      billingPeriod="monthly"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No plans available at the moment.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
