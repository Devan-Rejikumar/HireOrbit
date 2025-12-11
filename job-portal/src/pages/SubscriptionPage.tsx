import { useEffect, useState } from 'react';
import { subscriptionService, SubscriptionPlan, SubscriptionStatusResponse } from '../api/subscriptionService';
import { SubscriptionCard } from '../components/subscription/SubscriptionCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  Building2,
  Calendar as CalendarIcon,
  Plus,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { MessagesDropdown } from '@/components/MessagesDropdown';
import { useTotalUnreadCount } from '@/hooks/useChat';
import { SubscriptionStatusBadge } from '@/components/subscription/SubscriptionStatusBadge';

export const SubscriptionPage = () => {
  const { role, user, company, logout } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Automatically determine userType based on role
  const userType: 'user' | 'company' = role === 'company' ? 'company' : 'user';

  // Get total unread message count
  const { data: totalUnreadMessages = 0 } = useTotalUnreadCount(
    role === 'jobseeker' ? user?.id || null : company?.id || null
  );

  useEffect(() => {
    if (role) {
      loadPlans();
      loadCurrentSubscription();
    }
  }, [role]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getPlans(userType);
      // Show all plans including Free
      setPlans(response.data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSubscription = async () => {
    try {
      const response = await subscriptionService.getSubscriptionStatus();
      if (response.data.subscription) {
        setCurrentPlanId(response.data.subscription.planId);
      }
    } catch (error) {
      console.log('No active subscription found');
    }
  };

  const handleSelectPlan = async (planId: string, billingPeriod: 'monthly' | 'yearly') => {
    try {
      navigate(`/subscriptions/checkout?planId=${planId}&billingPeriod=${billingPeriod}`);
    } catch (error) {
      console.error('Error selecting plan:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // Sidebar items based on role
  const sidebarItems = role === 'company' 
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/company/dashboard' },
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
    if (item.path) {
      navigate(item.path);
    }
  };

  // Determine which plan is "most popular" (usually the middle one or Premium)
  const getPopularPlanIndex = () => {
    if (plans.length === 0) return -1;
    // If 3 plans, middle one is popular. If 2 plans, Premium is popular
    if (plans.length === 3) return 1;
    const premiumIndex = plans.findIndex(p => p.name.toLowerCase() === 'premium');
    return premiumIndex !== -1 ? premiumIndex : Math.floor(plans.length / 2);
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
            onClick={() => navigate('/login')}
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
      <header className="bg-white border-b border-gray-200 px-6 py-4 fixed top-0 left-0 right-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Hire Orbit Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Hire Orbit</span>
            </div>
            
            {/* Company/User Info */}
            {role === 'company' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Company</span>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{company?.companyName || 'Company'}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Subscription Status Badge */}
            {role === 'company' && <SubscriptionStatusBadge userType="company" />}
            
            {/* Post Job Button - Only for companies */}
            {role === 'company' && (
              <div className="flex items-center gap-2">
                <Button 
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => navigate('/company/post-job')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post a job
                </Button>
              </div>
            )}
            
            {/* Notification Bell */}
            <div className="relative">
              <Bell className="h-6 w-6 text-gray-600 hover:text-gray-900 cursor-pointer" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
            
            {/* Logout Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen relative">
        {/* Sidebar */}
        {role === 'company' ? (
          <aside className="w-64 bg-white shadow-sm border-r border-gray-200 fixed top-[68px] left-0 bottom-0 overflow-y-auto transition-all duration-300 z-10">
            <nav className="p-6">
              <div className="space-y-1 mb-8">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Main</h3>
                <button 
                  onClick={() => navigate('/company/dashboard')}
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
                >
                  <Home className="h-5 w-5" />
                  Dashboard
                </button>
                <button 
                  onClick={() => navigate('/chat')}
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left relative"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="flex-1">Messages</span>
                  {totalUnreadMessages > 0 && (
                    <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                    </span>
                  )}
                </button>
                <button onClick={() => navigate('/company/dashboard')} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                  <Building2 className="h-5 w-5" />
                  Company Profile
                </button>
                <button onClick={() => navigate('/company/applications')} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                  <User className="h-5 w-5" />
                  All Applicants
                </button>
                <button onClick={() => navigate('/company/jobs')} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                  <Briefcase className="h-5 w-5" />
                  Job Listing
                </button>
                <button 
                  onClick={() => navigate('/company/interviews')}
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
                >
                  <CalendarIcon className="h-5 w-5" />
                  Interview Management
                </button>
                <button 
                  onClick={() => navigate('/subscriptions')}
                  className="flex items-center gap-3 px-3 py-2 bg-purple-50 text-purple-700 font-medium rounded-lg w-full text-left"
                >
                  <CreditCard className="h-5 w-5" />
                  Plans & Billing
                </button>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Setting</h3>
                <button onClick={() => navigate('/company/settings')} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                  <Settings className="h-5 w-5" />
                  Settings
                </button>
              </div>
            </nav>
            
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100 hover:shadow-md transition-all duration-300">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{company?.companyName || 'Company'}</div>
                  <div className="text-xs text-purple-600">{company?.email || 'email@company.com'}</div>
                </div>
              </div>
            </div>
          </aside>
        ) : (
          <aside className="w-64 bg-white shadow-sm border-r border-gray-200 fixed top-[68px] left-0 bottom-0 overflow-y-auto transition-all duration-300 z-10">
            <nav className="p-6">
              <div className="space-y-1 mb-8">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Main</h3>
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = window.location.pathname === item.path;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSidebarClick(item)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${
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
                  onClick={() => navigate('/subscriptions')}
                  className="flex items-center gap-3 px-3 py-2 bg-purple-50 text-purple-700 font-medium rounded-lg w-full text-left"
                >
                  <CreditCard className="h-5 w-5" />
                  Plans & Billing
                </button>
              </div>
            </nav>
            
            <div className="absolute bottom-6 left-6 right-6">
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
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 p-8 pt-[84px] ml-64`}>
          <div className="max-w-6xl mx-auto">
            {/* Page Title and Description */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Plans & Pricing</h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Choose the plan that fits your needs. All plans include essential features to get you started, 
                with options to scale as you grow. No hidden fees and the flexibility to change anytime.
              </p>
            </div>

            {/* Plans Grid */}
            {plans.length > 0 ? (
              <div className={`grid gap-6 ${
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
              <div className="text-center py-12">
                <p className="text-gray-600">No plans available at the moment.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
