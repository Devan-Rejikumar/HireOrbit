import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { 
  User as UserIcon, 
  Calendar, 
  MessageSquare, 
  Lock, 
  LogOut, 
  Home,
  Search,
  Briefcase,
  Settings,
  FileCheck,
  Sparkles,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { MessagesDropdown } from '@/components/MessagesDropdown';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import AppliedJobs from '@/components/AppliedJobs';
import { useTotalUnreadCount } from '@/hooks/useChat';
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner';
import { SubscriptionStatusBadge } from '@/components/subscription/SubscriptionStatusBadge';
import { subscriptionService, SubscriptionStatusResponse } from '@/api/subscriptionService';
import { _interviewService, InterviewWithDetails } from '@/api/interviewService';
import { _applicationService, Application } from '@/api/applicationService';
import api from '@/api/axios';
import type { User } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
);

type DateRange = '30days' | '3months' | '6months' | '1year' | 'all';
type StatusFilter = 'all' | 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string | null;
  badge?: number;
  premium?: boolean;
};

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState<number>(0);
  const [upcomingInterviewsCount, setUpcomingInterviewsCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Premium dashboard states
  const [premiumApplications, setPremiumApplications] = useState<Application[]>([]);
  const [premiumInterviews, setPremiumInterviews] = useState<InterviewWithDetails[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPremiumData, setLoadingPremiumData] = useState(false);
  
  // Get total unread message count
  const { data: totalUnreadMessages = 0 } = useTotalUnreadCount(user?.id || null);

  const getFilterDate = (range: DateRange): Date | null => {
    const now = new Date();
    switch (range) {
    case '30days':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '3months':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '6months':
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    case '1year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return null;
    }
  };

  const loadProfileCompletion = useCallback(async () => {
    try {
      interface ProfileCompletionResponse {
        success: boolean;
        data: {
          profile: Record<string, unknown>;
          user: User;
          completionPercentage: number;
        };
        message: string;
      }
      const response = await api.get<ProfileCompletionResponse>('/profile/full');
      
      if (response.data.data?.completionPercentage !== undefined) {
        setProfileCompletion(response.data.data.completionPercentage);
      }
    } catch (_error) {
      setProfileCompletion(0);
    }
  }, []);

  const loadUpcomingInterviews = useCallback(async () => {
    try {
      const response = await _interviewService.getCandidateInterviews(1, 100); // Get all interviews
      const interviews = response.data?.interviews || response.data || [];
      
      // Filter for upcoming interviews (future date, not cancelled or completed)
      const upcoming = interviews.filter((interview: InterviewWithDetails) => {
        const interviewDate = new Date(interview.scheduledAt);
        const now = new Date();
        return interviewDate > now && 
               interview.status !== 'CANCELLED' && 
               interview.status !== 'COMPLETED';
      });
      
      setUpcomingInterviewsCount(upcoming.length);
    } catch (_error) {
      setUpcomingInterviewsCount(0);
    }
  }, []);

  const loadDashboardStats = useCallback(async () => {
    if (!user?.id) return;
    
    setLoadingStats(true);
    try {
      // Load all stats in parallel
      await Promise.all([
        loadProfileCompletion(),
        loadUpcomingInterviews(),
      ]);
    } catch (_error) {
      // Silently handle error
    } finally {
      setLoadingStats(false);
    }
  }, [user?.id, loadProfileCompletion, loadUpcomingInterviews]);

  const loadPremiumApplications = useCallback(async () => {
    try {
      const response = await _applicationService.getUserApplications(1, 1000);
      let apps = response.data.applications || [];
      
      // Filter by date range
      const filterDate = getFilterDate(dateRange);
      if (filterDate) {
        apps = apps.filter(app => new Date(app.appliedAt) >= filterDate);
      }
      
      setPremiumApplications(apps);
    } catch (_error) {
      setPremiumApplications([]);
    }
  }, [dateRange]);

  const loadPremiumInterviews = useCallback(async () => {
    try {
      const response = await _interviewService.getCandidateInterviews(1, 1000);
      const interviewsList = response.data?.interviews || response.data || [];
      setPremiumInterviews(interviewsList);
    } catch (_error) {
      setPremiumInterviews([]);
    }
  }, []);

  const loadPremiumDashboardData = useCallback(async () => {
    if (!user?.id || !isPremium) return;
    
    setLoadingPremiumData(true);
    try {
      await Promise.all([
        loadPremiumApplications(),
        loadPremiumInterviews(),
      ]);
    } catch (_error) {
      // Silently handle error
    } finally {
      setLoadingPremiumData(false);
    }
  }, [user?.id, isPremium, loadPremiumApplications, loadPremiumInterviews]);

  const loadSubscriptionStatus = useCallback(async () => {
    try {
      const response = await subscriptionService.getSubscriptionStatus();
      setSubscriptionStatus(response.data);
      const currentPlan = response.data?.plan;
      const premium = currentPlan?.name?.toLowerCase() === 'premium' && response.data?.isActive === true;
      setIsPremium(premium);
      
      // Load premium data if user is premium
      if (premium && activeSection === 'overview') {
        loadPremiumDashboardData();
      }
    } catch (_error: unknown) {
      setIsPremium(false);
    }
  }, [activeSection, loadPremiumDashboardData]);

  useEffect(() => {
    loadSubscriptionStatus();
    if (activeSection === 'overview') {
      loadDashboardStats();
      if (isPremium) {
        loadPremiumDashboardData();
      }
    }
  }, [activeSection, user?.id, isPremium, loadDashboardStats, loadPremiumDashboardData, loadSubscriptionStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardStats();
    if (isPremium) {
      await loadPremiumDashboardData();
    }
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME, { replace: true });
  };

  const messagesItem: SidebarItem = {
    id: 'messages',
    label: 'Messages',
    icon: MessageSquare,
    path: '/messages',
    ...(totalUnreadMessages > 0 ? { badge: totalUnreadMessages } : {}),
  };

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: Home, path: null },
    { id: 'profile', label: 'Profile', icon: UserIcon, path: '/profile' },
    { id: 'applied-jobs', label: 'Applied Jobs', icon: Briefcase, path: '/applied-jobs' },
    { id: 'offers', label: 'My Offers', icon: FileText, path: '/user/offers' },
    { id: 'schedule', label: 'My Schedule', icon: Calendar, path: '/schedule' },
    messagesItem,
    ...(isPremium ? [{ id: 'ats-checker', label: 'ATS Score Checker', icon: FileCheck, path: '/ats-checker', premium: true }] : []),
    { id: 'password', label: 'Change Password', icon: Lock, path: null },
  ];

  // Filter applications for premium dashboard
  const filteredApplications = useMemo(() => {
    let filtered = premiumApplications;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.jobTitle?.toLowerCase().includes(term) ||
        app.companyName?.toLowerCase().includes(term),
      );
    }
    
    return filtered;
  }, [premiumApplications, statusFilter, searchTerm]);

  // Calculate premium statistics
  const premiumStats = useMemo(() => {
    const total = filteredApplications.length;
    const shortlisted = filteredApplications.filter(a => a.status === 'SHORTLISTED').length;
    const accepted = filteredApplications.filter(a => a.status === 'ACCEPTED').length;
    const rejected = filteredApplications.filter(a => a.status === 'REJECTED').length;
    const pending = filteredApplications.filter(a => a.status === 'PENDING' || a.status === 'REVIEWING').length;
    const scheduledInterviews = premiumInterviews.filter(i => 
      i.status === 'PENDING' || i.status === 'CONFIRMED',
    ).length;
    const successRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0';
    
    return { total, shortlisted, accepted, rejected, pending, scheduledInterviews, successRate };
  }, [filteredApplications, premiumInterviews]);

  // Prepare bar chart data
  const barChartData = useMemo(() => {
    const days = dateRange === '30days' ? 30 : dateRange === '3months' ? 90 : dateRange === '6months' ? 180 : 365;
    const labels: string[] = [];
    const data: number[] = [];
    
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      labels.push(dateStr);
      
      const count = filteredApplications.filter(app => {
        const appDate = new Date(app.appliedAt);
        return appDate.toDateString() === date.toDateString();
      }).length;
      data.push(count);
    }
    
    return {
      labels,
      datasets: [{
        label: 'Applications',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      }],
    };
  }, [filteredApplications, dateRange]);

  // Prepare pie chart data
  const pieChartData = useMemo(() => {
    const statusCounts = {
      PENDING: filteredApplications.filter(a => a.status === 'PENDING').length,
      REVIEWING: filteredApplications.filter(a => a.status === 'REVIEWING').length,
      SHORTLISTED: filteredApplications.filter(a => a.status === 'SHORTLISTED').length,
      ACCEPTED: filteredApplications.filter(a => a.status === 'ACCEPTED').length,
      REJECTED: filteredApplications.filter(a => a.status === 'REJECTED').length,
      WITHDRAWN: filteredApplications.filter(a => a.status === 'WITHDRAWN').length,
    };
    
    return {
      labels: ['Pending', 'Reviewing', 'Shortlisted', 'Accepted', 'Rejected', 'Withdrawn'],
      datasets: [{
        data: [
          statusCounts.PENDING,
          statusCounts.REVIEWING,
          statusCounts.SHORTLISTED,
          statusCounts.ACCEPTED,
          statusCounts.REJECTED,
          statusCounts.WITHDRAWN,
        ],
        backgroundColor: [
          'rgba(234, 179, 8, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(156, 163, 175, 0.7)',
        ],
        borderColor: [
          'rgba(234, 179, 8, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 2,
      }],
    };
  }, [filteredApplications]);

  const getStatusColor = (status: string) => {
    switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800';
    case 'REVIEWING': return 'bg-blue-100 text-blue-800';
    case 'SHORTLISTED': return 'bg-purple-100 text-purple-800';
    case 'ACCEPTED': return 'bg-green-100 text-green-800';
    case 'REJECTED': return 'bg-red-100 text-red-800';
    case 'WITHDRAWN': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSidebarClick = (item: SidebarItem) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.id === 'password') {
      setIsChangePasswordModalOpen(true);
    } else {
      setActiveSection(item.id);
      // Refresh stats when switching to overview
      if (item.id === 'overview') {
        loadDashboardStats();
        if (isPremium) {
          loadPremiumDashboardData();
        }
      }
    }
  };

  // Refresh stats when window regains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (activeSection === 'overview' && user?.id) {
        loadDashboardStats();
        if (isPremium) {
          loadPremiumDashboardData();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeSection, user?.id, isPremium, loadDashboardStats, loadPremiumDashboardData]);

  // Reload premium data when date range changes
  useEffect(() => {
    if (isPremium && activeSection === 'overview') {
      loadPremiumApplications();
    }
  }, [dateRange, isPremium, activeSection, loadPremiumApplications]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {activeSection === 'applied-jobs' ? 'Applied Jobs' : 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Subscription Status Badge */}
              <SubscriptionStatusBadge userType="user" />
              
              {/* Refresh Button - Only show on overview */}
              {activeSection === 'overview' && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                  title="Refresh Dashboard"
                >
                  <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              )}
              
              {/* Search Jobs */}
              <button 
                onClick={() => navigate(ROUTES.JOBS)} 
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                title="Search Jobs"
              >
                <Search className="h-5 w-5" />
              </button>
              
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* Messages Dropdown */}
              {user?.id && (
                <MessagesDropdown userId={user.id} />
              )}
              
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
        </div>
      </header>

      <div className="flex min-h-screen relative">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 sticky top-[73px] self-start h-[calc(100vh-73px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <nav className="p-6">
            <div className="space-y-1 mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Main</h3>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSidebarClick(item)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left relative transition-colors ${
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
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Settings</h3>
              <button 
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <Settings className="h-5 w-5" />
                Settings
              </button>
            </div>
            
            {/* User Info */}
            <div className="mt-8">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{user?.username || 'User'}</div>
                  <div className="text-xs text-blue-600 truncate">{user?.email || 'email@example.com'}</div>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeSection === 'overview' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.username || 'User'}!</h2>
              <p className="text-gray-600 mb-8">Here's an overview of your account activity.</p>
              
              {/* Subscription Banner */}
              <SubscriptionBanner userType="user" />
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Profile Completion</p>
                      {loadingStats ? (
                        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{profileCompletion}%</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Upcoming Interviews</p>
                      {loadingStats ? (
                        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{upcomingInterviewsCount}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Unread Messages</p>
                      {loadingStats ? (
                        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{totalUnreadMessages}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Dashboard Features - Only for Premium Users */}
              {isPremium && (
                <>
                  {/* Premium Filters */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                        <select
                          value={dateRange}
                          onChange={(e) => setDateRange(e.target.value as DateRange)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="30days">Last 30 Days</option>
                          <option value="3months">Last 3 Months</option>
                          <option value="6months">Last 6 Months</option>
                          <option value="1year">Last Year</option>
                          <option value="all">All Time</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Status</option>
                          <option value="PENDING">Pending</option>
                          <option value="REVIEWING">Reviewing</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="ACCEPTED">Accepted</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="WITHDRAWN">Withdrawn</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Job title or company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Premium Statistics Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Briefcase className="h-4 w-4" />
                        <span className="text-xs font-medium">Total</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{premiumStats.total}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-medium">Pending</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">{premiumStats.pending}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs font-medium">Shortlisted</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">{premiumStats.shortlisted}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Accepted</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{premiumStats.accepted}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Rejected</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600">{premiumStats.rejected}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs font-medium">Interviews</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{premiumStats.scheduledInterviews}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs font-medium">Success Rate</span>
                      </div>
                      <p className="text-2xl font-bold text-indigo-600">{premiumStats.successRate}%</p>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications Over Time</h3>
                      <div className="h-64">
                        <Bar 
                          data={barChartData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                          }}
                        />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
                      <div className="h-64">
                        <Pie 
                          data={pieChartData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom' } },
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recent Applications Table */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Applications ({filteredApplications.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredApplications.slice(0, 10).map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {app.jobTitle || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {app.companyName || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                  {app.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(app.appliedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => navigate(`/jobs/${app.jobId}`)}
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredApplications.length === 0 && (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No applications found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate(ROUTES.PROFILE)}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <UserIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">View Profile</p>
                      <p className="text-sm text-gray-600">Manage your profile information</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate(ROUTES.SCHEDULE)}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <Calendar className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">My Schedule</p>
                      <p className="text-sm text-gray-600">View your interview schedule</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate(ROUTES.JOBS)}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <Search className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Find Jobs</p>
                      <p className="text-sm text-gray-600">Browse available job opportunities</p>
                    </div>
                  </button>
                  
                  {isPremium ? (
                    <button
                      onClick={() => navigate(ROUTES.ATS_CHECKER)}
                      className="flex items-center gap-3 p-4 border-2 border-purple-300 rounded-lg hover:bg-purple-50 transition-colors text-left bg-gradient-to-r from-purple-50 to-blue-50"
                    >
                      <div className="relative">
                        <FileCheck className="h-5 w-5 text-purple-600" />
                        <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          ATS Score Checker
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">Premium</span>
                        </p>
                        <p className="text-sm text-gray-600">Optimize your resume for job applications</p>
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(ROUTES.SUBSCRIPTIONS)}
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left opacity-60"
                      disabled
                    >
                      <FileCheck className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-500 flex items-center gap-2">
                          ATS Score Checker
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded">Premium</span>
                        </p>
                        <p className="text-sm text-gray-400">Upgrade to Premium to unlock</p>
                      </div>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setIsChangePasswordModalOpen(true)}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <Lock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-gray-900">Change Password</p>
                      <p className="text-sm text-gray-600">Update your account password</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'applied-jobs' && user?.id && (
            <AppliedJobs userId={user.id} />
          )}
        </main>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
};

export default UserDashboard;

