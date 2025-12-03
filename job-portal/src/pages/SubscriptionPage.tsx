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
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { MessagesDropdown } from '@/components/MessagesDropdown';
import { useTotalUnreadCount } from '@/hooks/useChat';

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
    return <div className="container mx-auto p-8">Loading plans...</div>;
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
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Plans & Pricing</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/jobs')} 
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Search Jobs"
              >
                <Search className="h-5 w-5" />
              </button>
              
              <NotificationBell />
              
              {(user?.id || company?.id) && (
                <MessagesDropdown userId={user?.id || company?.id || ''} />
              )}
              
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
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 relative">
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
                onClick={() => navigate('/subscriptions')}
                className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg w-full text-left"
              >
                <CreditCard className="h-5 w-5" />
                Plans & Pricing
              </button>
            </div>
          </nav>
          
          {/* User Info at Bottom */}
          <div className="absolute bottom-6 left-6 right-6">
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
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
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
