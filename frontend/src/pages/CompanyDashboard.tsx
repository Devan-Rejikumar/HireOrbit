import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Briefcase, Plus, LogOut, UserCheck, MapPin, Edit, Trash2, ChevronLeft, ChevronRight, TrendingUp, Calendar, CheckCircle, AlertCircle, Settings, BarChart3, Eye, FileText, Star, Mail, Home, MessageSquare, User, GraduationCap, Clock, CreditCard, Bell, ChevronDown, ArrowRight, Calendar as CalendarIcon, RefreshCw, XCircle, Search, Lock } from 'lucide-react';
import api from '@/api/axios';
import EditJobModal from '@/components/EditJobModal';
import EditCompanyProfileModal from '@/components/EditCompanyProfileModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import CompanyDetailsModal from '@/components/CompanyDetailsModal';
import { MessagesSidebar } from '@/components/MessagesSidebar';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { useTotalUnreadCount, useCompanyConversations, useMarkAsRead, useMessages } from '@/hooks/useChat';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ConversationResponse } from '@/api/chatService';
import { Logo } from '@/components/Logo';
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner';
import { SubscriptionStatusBadge } from '@/components/subscription/SubscriptionStatusBadge';
import { subscriptionService, SubscriptionStatusResponse } from '@/api/subscriptionService';
import { _applicationService, Application } from '@/api/applicationService';
import { _interviewService, InterviewWithDetails } from '@/api/interviewService';
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
type StatusFilter = 'all' | 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED';

interface Company {
  id: string;
  companyName: string;
  email: string;
  industry?: string;
  size?: string;
  isVerified: boolean;
  profileCompleted?: boolean;
  jobCount?: number;
  rejectionReason?: string;
  logo?: string;
}

interface ProfileStep {
  profileCompleted: boolean;
  currentStep: number;
}

interface CompanyProfileResponse {
  company: Company;
  profileStep?: ProfileStep | null;
}

const CompanyDashboard = () => {
  const { logout, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileStep, setProfileStep] = useState<ProfileStep | null>(null);
  const [jobCount, setJobCount] = useState<number>(0);
  
  // New dashboard states
  const [selectedCompany, setSelectedCompany] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [timeFilter, setTimeFilter] = useState('Week');
  const [dashboardStats, setDashboardStats] = useState({
    newCandidates: 0,
    scheduleToday: 0,
    messagesReceived: 0,
    jobViews: 0,
    jobApplied: 0,
    jobsOpened: 0,
    totalApplicants: 0,
  });

  // Minimal local type for jobs shown in dashboard
  type DashboardJob = {
    id: string;
    title: string;
    description?: string;
    company: string;
    location: string;
    salary?: number;
    jobType: string;
    requirements: string[];
    benefits: string[];
    experienceLevel: string;
    education: string;
    applicationDeadline: string;
    workLocation: string;
    createdAt: string;
    isActive?: boolean;
    status?: 'active' | 'inactive' | 'deleted';
  };
  const [jobs, setJobs] = useState<DashboardJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<DashboardJob | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<DashboardJob | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAllCompanyInfo, setShowAllCompanyInfo] = useState(false);
  const [isCompanyDetailsOpen, setIsCompanyDetailsOpen] = useState(false);
  const [isMessagesSidebarOpen, setIsMessagesSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ConversationResponse | null>(null);
  const [otherParticipantName, setOtherParticipantName] = useState<string>('');
  
  // Job Updates pagination
  const [jobUpdatesPage, setJobUpdatesPage] = useState(1);
  const jobUpdatesPageSize = 2;

  // Premium dashboard states
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'basic' | 'premium'>('free');
  const [isPremium, setIsPremium] = useState(false);
  const [premiumApplications, setPremiumApplications] = useState<Application[]>([]);
  const [premiumInterviews, setPremiumInterviews] = useState<InterviewWithDetails[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPremiumData, setLoadingPremiumData] = useState(false);

  // Get total unread message count
  const { data: totalUnreadMessages = 0 } = useTotalUnreadCount(company?.id || null);
  
  // Get all conversations to find ones with unread messages
  const { data: allConversations = [] } = useCompanyConversations(company?.id || '');
  
  // Get messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useMessages(
    selectedConversation?.id || null,
  );
  const markAsReadMutation = useMarkAsRead();

  // Use cached user profile hook to get participant name
  const otherParticipantId = selectedConversation?.userId;
  const { data: userProfile } = useUserProfile(role === 'company' ? otherParticipantId : null);
  
  // Update participant name when user profile is loaded
  useEffect(() => {
    if (role === 'company' && userProfile) {
      const userName = userProfile.username || userProfile.name || 'User';
      setOtherParticipantName(userName);
    } else if (!selectedConversation || role !== 'company') {
      setOtherParticipantName('');
    }
  }, [userProfile, selectedConversation, role]);

  useEffect(() => {
    fetchCompanyProfile();
    fetchJobCount();
    loadSubscriptionStatus();
  }, []);

  useEffect(() => {
    if (activeSection === 'overview' && company?.id) {
      // Always load data for stats, but premium features are gated
      loadPremiumDashboardData();
    }
  }, [activeSection, company?.id, dateRange]);

  // Load data when plan changes
  useEffect(() => {
    if (activeSection === 'overview' && company?.id && currentPlan !== 'free') {
      loadPremiumDashboardData();
    }
  }, [currentPlan]);

  useEffect(() => {
    if (company?.companyName) {
      fetchJobs();
      setSelectedCompany(company.companyName);
    }
  }, [company?.companyName]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      // Load real data if not already loaded
      let allApplications = premiumApplications;
      let allInterviews = premiumInterviews;

      if (allApplications.length === 0 || allInterviews.length === 0) {
        try {
          // Load applications
          const appsResponse = await api.get<{ data?: { applications?: Application[] } }>('/applications/company/applications');
          allApplications = appsResponse.data?.data?.applications || [];
          
          // Load interviews
          const interviewsResponse = await _interviewService.getCompanyInterviews();
          const interviewsData = interviewsResponse.data;
          allInterviews = (interviewsData && 'interviews' in interviewsData && Array.isArray(interviewsData.interviews)) 
            ? interviewsData.interviews 
            : (Array.isArray(interviewsData) ? interviewsData : []);
          allInterviews = Array.isArray(allInterviews) ? allInterviews : [];
        } catch (error) {
          // Silently handle error
        }
      }

      // Calculate new candidates (pending applications)
      const newCandidates = Array.isArray(allApplications) ? allApplications.filter((app: Application) => 
        app.status === 'PENDING' || app.status === 'REVIEWING',
      ).length : 0;

      // Calculate interviews scheduled for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const scheduleToday = Array.isArray(allInterviews) ? allInterviews.filter((interview: InterviewWithDetails) => {
        const interviewDate = new Date(interview.scheduledAt);
        return interviewDate >= today && 
               interviewDate < tomorrow &&
               interview.status !== 'CANCELLED' &&
               interview.status !== 'COMPLETED';
      }).length : 0;

      // Job Applied - total applications
      const jobApplied = Array.isArray(allApplications) ? allApplications.length : 0;

      // Active jobs
      const activeJobs = jobs.filter(job => job.isActive !== false && job.status !== 'deleted');
      
      setDashboardStats({
        newCandidates,
        scheduleToday,
        messagesReceived: totalUnreadMessages, // Already synced via useTotalUnreadCount
        jobViews: 0, // Removed - not needed
        jobApplied,
        jobsOpened: activeJobs.length,
        totalApplicants: Array.isArray(allApplications) ? allApplications.length : 0,
      });
    } catch (error) {
      // Silently handle error
    }
  }, [jobs, premiumApplications, premiumInterviews, totalUnreadMessages]);

  useEffect(() => {
    // Update stats when jobs data changes or premium data loads
    fetchDashboardStats();
  }, [jobs, premiumApplications, premiumInterviews, totalUnreadMessages, fetchDashboardStats]);

  const fetchCompanyProfile = async () => {
    try {
      const response = await api.get<{
        success: boolean;
        data: {
          company: Company;
          profileStep?: ProfileStep | null | undefined;
        };
        company?: Company;
        profileStep?: ProfileStep | null | undefined;
      }>('/company/profile');

      // Check the actual response structure
      if (response.data && response.data.success && response.data.data && response.data.data.company) {
        setCompany(response.data.data.company);
        setProfileStep(response.data.data.profileStep || null);
      } else if (response.data && response.data.company) {
        setCompany(response.data.company);
        setProfileStep(response.data.profileStep || null);
      } else {
        setCompany(null);
        setProfileStep(null);
      }
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  };

  const fetchJobCount = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: { count: number } }>('/company/job-count');
      setJobCount(response.data.data.count || 0);
    } catch (error) {
      setJobCount(0);
    }
  };

  const fetchJobs = async (): Promise<void> => {
    try {
      if (!company?.id) return; // ✅ Use company.id instead of companyName
      const res = await api.get<{
        data: { jobs: DashboardJob[] };
      }>(`/jobs/company/${company.id}`); // ✅ Use company.id directly
      const list: DashboardJob[] = res.data?.data?.jobs ?? [];
      setJobs(list);
    } catch (error) {
      setJobs([]);
    }
  };

  const loadSubscriptionStatus = async () => {
    try {
      const response = await subscriptionService.getSubscriptionStatus();
      setSubscriptionStatus(response.data);
      const plan = response.data?.plan;
      const planName = plan?.name?.toLowerCase() || 'free';
      const isActive = response.data?.isActive === true;
      
      if (planName === 'premium' && isActive) {
        setCurrentPlan('premium');
        setIsPremium(true);
      } else if (planName === 'basic' && isActive) {
        setCurrentPlan('basic');
        setIsPremium(false);
      } else {
        setCurrentPlan('free');
        setIsPremium(false);
      }
    } catch (error: unknown) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { status?: number } }) : null;
      if (axiosError && (axiosError.response?.status === 401 || axiosError.response?.status === 403)) {
        setCurrentPlan('free');
        setIsPremium(false);
      }
    }
  };

  const loadPremiumDashboardData = async () => {
    if (!company?.id) return;
    
    setLoadingPremiumData(true);
    try {
      await Promise.all([
        loadPremiumApplications(),
        loadPremiumInterviews(),
      ]);
    } catch (error) {
      // Silently handle error
    } finally {
      setLoadingPremiumData(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    await fetchJobCount();
    await fetchDashboardStats();
    if (currentPlan !== 'free') {
      await loadPremiumDashboardData();
    }
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const loadPremiumApplications = async () => {
    try {
      const response = await api.get<{ data?: { applications?: Application[] } }>('/applications/company/applications');
      let apps: Application[] = response.data?.data?.applications || [];
      
      // Filter by date range
      const filterDate = getFilterDate(dateRange);
      if (filterDate) {
        apps = apps.filter((app: Application) => {
          const appDate = app.appliedAt ? new Date(app.appliedAt) : new Date();
          return appDate >= filterDate;
        });
      }
      
      setPremiumApplications(apps);
    } catch (error) {
      setPremiumApplications([]);
    }
  };

  const loadPremiumInterviews = async () => {
    try {
      const response = await _interviewService.getCompanyInterviews();
      const interviewsData = response.data;
      const interviewsList = (interviewsData && 'interviews' in interviewsData && Array.isArray(interviewsData.interviews))
        ? interviewsData.interviews
        : (Array.isArray(interviewsData) ? interviewsData : []);
      setPremiumInterviews(Array.isArray(interviewsList) ? interviewsList : []);
    } catch (error) {
      setPremiumInterviews([]);
    }
  };

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

  // Filter applications for premium dashboard
  const filteredApplications = useMemo(() => {
    let filtered = premiumApplications;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter((app: Application) => app.status === statusFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((app: Application) => 
        app.jobTitle?.toLowerCase().includes(term) ||
        (app as Application & { userName?: string; userEmail?: string }).userName?.toLowerCase().includes(term) ||
        (app as Application & { userName?: string; userEmail?: string }).userEmail?.toLowerCase().includes(term),
      );
    }
    
    return filtered;
  }, [premiumApplications, statusFilter, searchTerm]);

  // Calculate premium statistics
  const premiumStats = useMemo(() => {
    const total = filteredApplications.length;
    const shortlisted = filteredApplications.filter((a: Application) => a.status === 'SHORTLISTED').length;
    const accepted = filteredApplications.filter((a: Application) => a.status === 'ACCEPTED').length;
    const rejected = filteredApplications.filter((a: Application) => a.status === 'REJECTED').length;
    const pending = filteredApplications.filter((a: Application) => a.status === 'PENDING' || a.status === 'REVIEWING').length;
    const scheduledInterviews = premiumInterviews.filter(i => 
      i.status === 'PENDING' || i.status === 'CONFIRMED',
    ).length;
    const successRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0';
    const activeJobs = jobs.filter(job => job.isActive !== false && job.status !== 'deleted').length;
    
    return { total, shortlisted, accepted, rejected, pending, scheduledInterviews, successRate, activeJobs };
  }, [filteredApplications, premiumInterviews, jobs]);

  // Calculate application summary by job type (using all applications, not filtered)
  const applicationSummaryByJobType = useMemo(() => {
    const summary: Record<string, number> = {
      'Full-time': 0,
      'Part-time': 0,
      'Contract': 0,
      'Internship': 0,
      'Remote': 0,
    };

    premiumApplications.forEach((app: Application) => {
      // Get job type from the application's job data
      const job = jobs.find(j => j.id === app.jobId);
      if (job) {
        const jobType = job.jobType?.toLowerCase() || '';
        if (jobType.includes('full') || jobType === 'full-time') {
          summary['Full-time']++;
        } else if (jobType.includes('part') || jobType === 'part-time') {
          summary['Part-time']++;
        } else if (jobType.includes('contract')) {
          summary['Contract']++;
        } else if (jobType.includes('intern')) {
          summary['Internship']++;
        } else if (jobType.includes('remote')) {
          summary['Remote']++;
        }
      }
    });

    return summary;
  }, [premiumApplications, jobs]);

  // Prepare bar chart data for Job Applied per month
  const jobAppliedChartData = useMemo(() => {
    const labels: string[] = [];
    const data: number[] = [];
    
    const now = new Date();
    let periodsToShow = 0;
    let periodType: 'day' | 'week' | 'month' = 'month';
    
    if (timeFilter === 'Week') {
      // Show last 7 days
      periodsToShow = 7;
      periodType = 'day';
    } else if (timeFilter === 'Month') {
      // Show last 6 months
      periodsToShow = 6;
      periodType = 'month';
    } else {
      // Show last 12 months
      periodsToShow = 12;
      periodType = 'month';
    }
    
    for (let i = periodsToShow - 1; i >= 0; i--) {
      let periodStart: Date;
      let periodEnd: Date;
      let label: string;
      
      if (periodType === 'day') {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        periodStart = date;
        periodEnd = new Date(date);
        periodEnd.setHours(23, 59, 59, 999);
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        periodStart = date;
        periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      
      labels.push(label);
      
      // Count applications in this period
      const count = filteredApplications.filter((app: Application) => {
        const appDate = app.appliedAt ? new Date(app.appliedAt) : new Date((app as Application & { createdAt?: string; updatedAt?: string }).createdAt || app.updatedAt);
        return appDate >= periodStart && appDate <= periodEnd;
      }).length;
      
      data.push(count);
    }
    
    return {
      labels,
      datasets: [{
        label: 'Applications Received',
        data,
        backgroundColor: 'rgba(168, 85, 247, 0.5)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1,
      }],
    };
  }, [filteredApplications, timeFilter]);

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
      
      const count = filteredApplications.filter((app: Application) => {
        const appDate = app.appliedAt ? new Date(app.appliedAt) : new Date((app as Application & { createdAt?: string; updatedAt?: string }).createdAt || app.updatedAt);
        return appDate.toDateString() === date.toDateString();
      }).length;
      data.push(count);
    }
    
    return {
      labels,
      datasets: [{
        label: 'Applications Received',
        data,
        backgroundColor: 'rgba(168, 85, 247, 0.5)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1,
      }],
    };
  }, [filteredApplications, dateRange]);

  // Prepare pie chart data
  const pieChartData = useMemo(() => {
    const statusCounts = {
      PENDING: filteredApplications.filter((a: Application) => a.status === 'PENDING').length,
      REVIEWING: filteredApplications.filter((a: Application) => a.status === 'REVIEWING').length,
      SHORTLISTED: filteredApplications.filter((a: Application) => a.status === 'SHORTLISTED').length,
      ACCEPTED: filteredApplications.filter((a: Application) => a.status === 'ACCEPTED').length,
      REJECTED: filteredApplications.filter((a: Application) => a.status === 'REJECTED').length,
    };
    
    return {
      labels: ['Pending', 'Reviewing', 'Shortlisted', 'Accepted', 'Rejected'],
      datasets: [{
        data: [
          statusCounts.PENDING,
          statusCounts.REVIEWING,
          statusCounts.SHORTLISTED,
          statusCounts.ACCEPTED,
          statusCounts.REJECTED,
        ],
        backgroundColor: [
          'rgba(234, 179, 8, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderColor: [
          'rgba(234, 179, 8, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
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
    default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpgradeClick = () => {
    navigate(ROUTES.SUBSCRIPTIONS);
    toast('Upgrade to unlock premium analytics features', { icon: '🔒' });
  };

  const handleEditJob = (job: DashboardJob): void => {
    setSelectedJob(job);
    setIsEditModalOpen(true);
  };

  const handleDeleteJob = (job: DashboardJob): void => {
    setJobToDelete(job);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteJob = async (): Promise<void> => {
    if (!jobToDelete) return;

    try {
      setIsDeleting(true);
      await api.delete(`/jobs/${jobToDelete.id}`);
      await fetchJobs();
      await fetchJobCount();
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
    } catch (error) {
      // Silently handle error
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteJob = (): void => {
    setIsDeleteModalOpen(false);
    setJobToDelete(null);
  };

  const handleJobUpdated = (): void => {
    fetchJobs();
    fetchJobCount();
  };

  const handleEditProfile = (): void => {
    setIsEditProfileModalOpen(true);
  };

  const handleProfileUpdated = (): void => {
    fetchCompanyProfile();
    setIsEditProfileModalOpen(false);
  };

  const handleCompanyProfileClick = () => {
    setIsCompanyDetailsOpen(true);
  };

  const handleJobListingClick = () => {
    navigate(ROUTES.COMPANY_JOBS);
  };

  const handleMessagesClick = async () => {
    // Simple: Mark all conversations as read when Messages is clicked
    if (company?.id && allConversations.length > 0) {
      // Mark all conversations as read (don't check unread count - just mark all)
      const markAllPromises = allConversations.map(conv =>
        markAsReadMutation.mutateAsync({
          conversationId: conv.id,
          userId: company.id,
        }),
      );
      
      // Don't wait for all to complete - just start them
      Promise.all(markAllPromises).catch(() => {
        // Silently handle error
      });
    }
    
    // Set active section to messages
    setActiveSection('messages');
  };

  const handleSelectConversation = (conversation: ConversationResponse) => {
    setSelectedConversation(conversation);
    if (company?.id) {
      markAsReadMutation.mutate({
        conversationId: conversation.id,
        userId: company.id,
      });
    }
  };

  const handleSendMessage = () => {
    // This will be handled by ChatWindow component
  };

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(jobs.length / pageSize));
  const pagedJobs = jobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const goToPage = (p: number) => setCurrentPage(Math.min(Math.max(1, p), totalPages));

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const handleCompleteProfile = () => {
    navigate(ROUTES.COMPANY_PROFILE_SETUP);
  };

  // Check if profile needs completion
  const needsProfileCompletion = !company?.profileCompleted && !company?.isVerified;

  // Calculate active jobs count
  const activeJobsCount = jobs.filter(job => job.isActive !== false && job.status !== 'deleted').length;

  // Job Updates pagination helpers
  const jobUpdatesTotalPages = Math.max(1, Math.ceil(jobs.length / jobUpdatesPageSize));
  const jobUpdatesStart = (jobUpdatesPage - 1) * jobUpdatesPageSize;
  const jobUpdatesEnd = jobUpdatesStart + jobUpdatesPageSize;
  const paginatedJobUpdates = jobs.slice(jobUpdatesStart, jobUpdatesEnd);
  
  const goToJobUpdatesPage = (page: number) => {
    setJobUpdatesPage(Math.min(Math.max(1, page), jobUpdatesTotalPages));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-700">Loading your dashboard...</h3>
          <p className="text-gray-500">Please wait while we fetch your data</p>
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
            {/* Company Logo */}
            <Logo size="md" textClassName="text-gray-900" iconClassName="bg-gradient-to-br from-purple-600 to-indigo-600" fallbackIcon="letter" />
            
            {/* Company Info */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Company</span >
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                {company?.logo ? (
                  <img 
                    src={company.logo} 
                    alt={company.companyName || 'Company logo'} 
                    className="w-6 h-6 rounded object-cover"
                  />
                ) : (
                  <Building2 className="h-4 w-4 text-gray-500" />
                )}
                <span className="font-medium">{company?.companyName || 'Company'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Subscription Status Badge */}
            <SubscriptionStatusBadge userType="company" />
            
            {/* Refresh Button - Only show on overview */}
            {activeSection === 'overview' && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                title="Refresh Dashboard"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            {/* Post Job Button */}
            <div className="flex items-center gap-2">
              <Button 
                className={`px-4 py-2 ${
                  company?.profileCompleted && company?.isVerified
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (company?.profileCompleted && company?.isVerified) {
                    navigate(ROUTES.COMPANY_POST_JOB);
                  }
                }}
                disabled={!company?.profileCompleted || !company?.isVerified}
              >
                <Plus className="h-4 w-4 mr-2" />
                Post a job
              </Button>
              
              {/* Notification message when button is disabled */}
              {(!company?.profileCompleted || !company?.isVerified) && (
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500 max-w-xs">
                    {!company?.profileCompleted 
                      ? 'Complete your profile to post jobs'
                      : !company?.isVerified 
                        ? 'Awaiting admin approval to post jobs'
                        : 'Complete profile and get approval to post jobs'
                    }
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(ROUTES.COMPANY_REVIEW_STATUS)}
                    className="text-xs px-2 py-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    Check Status
                  </Button>
                </div>
              )}
            </div>
            
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
        <aside className={`${isSidebarCollapsed ? 'hidden' : 'w-64'} bg-white shadow-sm border-r border-gray-200 fixed top-[68px] left-0 bottom-0 overflow-y-auto hide-scrollbar transition-all duration-300 z-10`}>
          <nav className="p-6">
            <div className="space-y-1 mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Main</h3>
              <button 
                onClick={() => setActiveSection('overview')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium w-full text-left ${
                  activeSection === 'overview'
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Home className="h-5 w-5" />
                Dashboard
              </button>
              <button 
                onClick={handleMessagesClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left relative ${
                  activeSection === 'messages'
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
              <button onClick={handleCompanyProfileClick} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                <Building2 className="h-5 w-5" />
                Company Profile
              </button>
              <button onClick={() => navigate(ROUTES.COMPANY_APPLICATIONS)} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                <User className="h-5 w-5" />
                All Applicants
              </button>
              <button onClick={handleJobListingClick} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                <Briefcase className="h-5 w-5" />
                Job Listing
              </button>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_INTERVIEWS)}
                className="flex items-start gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <CalendarIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="flex flex-col leading-tight">
                  <span>Interview</span>
                  <span>Management</span>
                </span>
              </button>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_OFFERS)}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <FileText className="h-5 w-5" />
                Offer Letters
              </button>
              <button 
                onClick={() => navigate(ROUTES.SUBSCRIPTIONS)}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <CreditCard className="h-5 w-5" />
                Plans & Billing
              </button>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Setting</h3>
              <button onClick={() => navigate(ROUTES.COMPANY_SETTINGS)} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                <Settings className="h-5 w-5" />
                Settings
              </button>
            </div>
            
            {/* Company Info */}
            <div className="mt-8">
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

        {/* Toggle Sidebar Button - Only show in messages section */}
        {activeSection === 'messages' && (
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`absolute top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 rounded-r-lg p-2 shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-50 ${
              isSidebarCollapsed ? 'left-0' : 'left-64'
            }`}
            aria-label={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            )}
          </button>
        )}

        {/* Main Content */}
        <main className={`flex-1 p-6 pt-[84px] ${isSidebarCollapsed ? 'ml-0' : 'ml-64'}`}>
          {activeSection === 'messages' && company?.id ? (
            <div className="h-[calc(100vh-68px)] flex -m-6">
              {/* Chat Sidebar */}
              <div className="w-1/3 border-r border-gray-200 bg-white">
                <ChatSidebar
                  conversations={allConversations}
                  selectedConversationId={selectedConversation?.id || null}
                  currentUserId={company.id}
                  onSelectConversation={handleSelectConversation}
                  role="company"
                />
              </div>

              {/* Chat Window */}
              <div className="flex-1 bg-white">
                {selectedConversation ? (
                  <ChatWindow
                    conversationId={selectedConversation.id}
                    currentUserId={company.id}
                    messages={messages}
                    isLoading={messagesLoading}
                    onSendMessage={handleSendMessage}
                    otherParticipantName={otherParticipantName}
                    otherParticipantId={selectedConversation.userId}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-gray-500 text-lg">Select a conversation to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Dashboard Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Good morning, {company?.companyName || 'Company'}.</h1>
                <p className="text-gray-600 mb-4">Here is your job listings statistic report from {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.</p>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>

              {/* Profile Completion Alert */}
              {needsProfileCompletion && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Complete Your Company Profile</h3>
                      <p className="text-sm text-gray-600">Your profile needs to be completed and approved before you can post jobs.</p>
                    </div>
                    <Button onClick={handleCompleteProfile} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                      <UserCheck className="h-4 w-4 mr-2" />
                  Complete Profile
                    </Button>
                  </div>
                </div>
              )}

              {/* Subscription Banner */}
              <SubscriptionBanner userType="company" />

              {/* Premium Dashboard Features - Same UI for all, but with feature gating */}
              {/* Premium Filters */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 relative">
                {currentPlan === 'free' && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex items-center justify-center z-10">
                    <div className="text-center">
                      <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 font-medium mb-2">Upgrade to Basic or Premium</p>
                      <Button onClick={handleUpgradeClick} className="bg-purple-600 hover:bg-purple-700 text-white">
                    Upgrade Now
                      </Button>
                    </div>
                  </div>
                )}
                <div className={`flex flex-col md:flex-row gap-4 ${currentPlan === 'free' ? 'opacity-50' : ''}`}>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <select
                      value={dateRange}
                      onChange={(e) => {
                        if (currentPlan === 'free') {
                          handleUpgradeClick();
                          return;
                        }
                        setDateRange(e.target.value as DateRange);
                      }}
                      disabled={currentPlan === 'free'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      onChange={(e) => {
                        if (currentPlan === 'free') {
                          handleUpgradeClick();
                          return;
                        }
                        setStatusFilter(e.target.value as StatusFilter);
                      }}
                      disabled={currentPlan === 'free'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="all">All Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="REVIEWING">Reviewing</option>
                      <option value="SHORTLISTED">Shortlisted</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Job title or candidate name..."
                        value={searchTerm}
                        onChange={(e) => {
                          if (currentPlan === 'free') {
                            handleUpgradeClick();
                            return;
                          }
                          setSearchTerm(e.target.value);
                        }}
                        disabled={currentPlan === 'free'}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-xs font-medium">Total Apps</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{currentPlan !== 'free' ? premiumStats.total : '—'}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium">Pending</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{currentPlan !== 'free' ? premiumStats.pending : '—'}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Shortlisted</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{currentPlan !== 'free' ? premiumStats.shortlisted : '—'}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Accepted</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{currentPlan !== 'free' ? premiumStats.accepted : '—'}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <XCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Rejected</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{currentPlan !== 'free' ? premiumStats.rejected : '—'}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-medium">Interviews</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{currentPlan !== 'free' ? premiumStats.scheduledInterviews : '—'}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Success Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-600">{currentPlan !== 'free' ? `${premiumStats.successRate}%` : '—'}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-xs font-medium">Active Jobs</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{premiumStats.activeJobs}</p>
                </div>
              </div>

              {/* Charts - Premium Feature */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Bar Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
                  {currentPlan === 'free' && (
                    <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex items-center justify-center z-10">
                      <div className="text-center">
                        <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 font-medium mb-2">Upgrade to view analytics</p>
                        <Button onClick={handleUpgradeClick} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                      Upgrade Now
                        </Button>
                      </div>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications Over Time</h3>
                  <div className="h-64">
                    {currentPlan !== 'free' ? (
                      <Bar 
                        data={barChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-gray-50 rounded">
                        <p className="text-gray-400">Upgrade to view chart</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
                  {currentPlan === 'free' && (
                    <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex items-center justify-center z-10">
                      <div className="text-center">
                        <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 font-medium mb-2">Upgrade to view analytics</p>
                        <Button onClick={handleUpgradeClick} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                      Upgrade Now
                        </Button>
                      </div>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
                  <div className="h-64">
                    {currentPlan !== 'free' ? (
                      <Pie 
                        data={pieChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'bottom' } },
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-gray-50 rounded">
                        <p className="text-gray-400">Upgrade to view chart</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Applications Table - Premium Feature */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 relative">
                {currentPlan === 'free' && (
                  <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex items-center justify-center z-10">
                    <div className="text-center">
                      <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 font-medium mb-2">Upgrade to view detailed applications</p>
                      <Button onClick={handleUpgradeClick} className="bg-purple-600 hover:bg-purple-700 text-white">
                    Upgrade Now
                      </Button>
                    </div>
                  </div>
                )}
                <div className={`p-4 border-b border-gray-200 ${currentPlan === 'free' ? 'opacity-50' : ''}`}>
                  <h3 className="text-base font-semibold text-gray-900">Recent Applications ({currentPlan !== 'free' ? filteredApplications.length : '—'})</h3>
                </div>
                <div className="overflow-y-auto max-h-[500px]">
                  <div className="min-w-0">
                    <table className="w-full table-fixed">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[25%]">Candidate</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[25%]">Job Title</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Applied</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[20%]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentPlan !== 'free' && filteredApplications.slice(0, 10).map((app: Application) => (
                          <tr key={app.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3">
                              <div className="text-xs font-medium text-gray-900 truncate">{(app as Application & { userName?: string; userEmail?: string }).userName || (app as Application & { userName?: string; userEmail?: string }).userEmail || 'N/A'}</div>
                              <div className="text-xs text-gray-500 truncate">{(app as Application & { userName?: string; userEmail?: string }).userEmail || ''}</div>
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-600 truncate" title={app.jobTitle || 'N/A'}>
                              {app.jobTitle || 'N/A'}
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-500">
                              {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                            </td>
                            <td className="px-3 py-3 text-xs">
                              <button
                                onClick={() => navigate(ROUTES.COMPANY_APPLICATIONS)}
                                className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" />
                          View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {currentPlan !== 'free' && filteredApplications.length === 0 && (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No applications found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* New candidates */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6 flex items-center justify-between hover:shadow-lg hover:shadow-blue-100 transition-all duration-300 group">
                  <div>
                    <div className="text-3xl font-bold text-blue-900 mb-1">{dashboardStats.newCandidates}</div>
                    <div className="text-blue-700 font-medium">New candidates to review</div>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
            
                {/* Schedule for today */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 p-6 flex items-center justify-between hover:shadow-lg hover:shadow-emerald-100 transition-all duration-300 group">
                  <div>
                    <div className="text-3xl font-bold text-emerald-900 mb-1">{dashboardStats.scheduleToday}</div>
                    <div className="text-emerald-700 font-medium">Schedule for today</div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CalendarIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
            
                {/* Messages received */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6 flex items-center justify-between hover:shadow-lg hover:shadow-purple-100 transition-all duration-300 group">
                  <div>
                    <div className="text-3xl font-bold text-purple-900 mb-1">{dashboardStats.messagesReceived}</div>
                    <div className="text-purple-700 font-medium">Messages received</div>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Job Statistics Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                  Job Statistics
                    </h2>
                    <p className="text-sm text-gray-500">
                      {timeFilter === 'Week' 
                        ? 'Showing job statistics for this week'
                        : timeFilter === 'Month'
                          ? 'Showing job statistics for last 6 months'
                          : 'Showing job statistics for last year'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        timeFilter === 'Week' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setTimeFilter('Week')}
                    >
                  Week
                    </button>
                    <button
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        timeFilter === 'Month' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setTimeFilter('Month')}
                    >
                  Month
                    </button>
                    <button
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        timeFilter === 'Year' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setTimeFilter('Year')}
                    >
                  Year
                    </button>
                  </div>
                </div>
            
                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                  <button
                    className={`pb-2 text-sm font-medium border-b-2 ${
                      activeTab === 'Overview' ? 'border-purple-500 text-purple-700' : 'border-transparent text-gray-600'
                    }`}
                    onClick={() => setActiveTab('Overview')}
                  >
                Overview
                  </button>
                  <button
                    className={`pb-2 text-sm font-medium border-b-2 ${
                      activeTab === 'Jobs View' ? 'border-purple-500 text-purple-700' : 'border-transparent text-gray-600'
                    }`}
                    onClick={() => setActiveTab('Jobs View')}
                  >
                Jobs View
                  </button>
                  <button
                    className={`pb-2 text-sm font-medium border-b-2 ${
                      activeTab === 'Jobs Applied' ? 'border-purple-500 text-purple-700' : 'border-transparent text-gray-600'
                    }`}
                    onClick={() => setActiveTab('Jobs Applied')}
                  >
                Jobs Applied
                  </button>
                </div>

                {/* Chart Area */}
                <div className="flex gap-6">
                  <div className="flex-1">
                    {/* Bar chart for Job Applied per month */}
                    <div className="h-64">
                      {currentPlan !== 'free' ? (
                        <Bar 
                          data={jobAppliedChartData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { 
                              legend: { display: false },
                              title: {
                                display: true,
                                text: 'Applications Received by Month',
                              },
                            },
                            scales: { 
                              y: { beginAtZero: true, ticks: { stepSize: 1 } }, 
                            },
                          }}
                        />
                      ) : (
                        <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">Upgrade to view chart</p>
                          </div>
                        </div>
                      )}
                    </div>
                
                    {/* Legend */}
                    <div className="flex gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-500 rounded"></div>
                        <span className="text-sm text-gray-600">Job Applied</span>
                      </div>
                    </div>
                  </div>
              
                  {/* Job Applied Card */}
                  <div className="w-64 space-y-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <FileText className="h-6 w-6 text-purple-600" />
                        <span className="font-medium text-gray-900">Job Applied</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {currentPlan !== 'free' ? dashboardStats.jobApplied : '—'}
                      </div>
                      <div className="text-sm text-gray-600">
                    Total applications received
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Applicants Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 relative">
                    {currentPlan === 'free' && (
                      <div className="absolute inset-0 bg-white bg-opacity-95 rounded-xl flex items-center justify-center z-10">
                        <div className="text-center">
                          <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 font-medium mb-2">Upgrade to view summary</p>
                          <Button onClick={handleUpgradeClick} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                        Upgrade Now
                          </Button>
                        </div>
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                  Application Summary
                    </h3>
                    <div className={`text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 ${currentPlan === 'free' ? 'opacity-50' : ''}`}>
                      {currentPlan !== 'free' ? premiumApplications.length : '—'}
                    </div>
                    <div className={`space-y-3 ${currentPlan === 'free' ? 'opacity-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Full Time</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {currentPlan !== 'free' ? applicationSummaryByJobType['Full-time'] : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Part-Time</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {currentPlan !== 'free' ? applicationSummaryByJobType['Part-time'] : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Remote</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {currentPlan !== 'free' ? applicationSummaryByJobType['Remote'] : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Internship</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {currentPlan !== 'free' ? applicationSummaryByJobType['Internship'] : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Contract</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {currentPlan !== 'free' ? applicationSummaryByJobType['Contract'] : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Updates - Extended */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-purple-600" />
                    Job Updates
                      </h3>
                      <div className="flex items-center gap-3">
                        {/* Pagination Controls */}
                        {jobs.length > jobUpdatesPageSize && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => goToJobUpdatesPage(jobUpdatesPage - 1)}
                              disabled={jobUpdatesPage <= 1}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                jobUpdatesPage <= 1 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                              }`}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-xs text-gray-500 px-2">
                              {jobUpdatesPage} / {jobUpdatesTotalPages}
                            </span>
                            <button
                              onClick={() => goToJobUpdatesPage(jobUpdatesPage + 1)}
                              disabled={jobUpdatesPage >= jobUpdatesTotalPages}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                jobUpdatesPage >= jobUpdatesTotalPages 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                              }`}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        <button 
                          onClick={handleJobListingClick}
                          className="text-sm text-purple-600 hover:text-purple-700 cursor-pointer"
                        >
                      View All →
                        </button>
                      </div>
                    </div>
                
                    {jobs.length === 0 ? (
                      <div className="text-center py-8">
                        <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">No jobs posted yet</p>
                        <Button 
                          onClick={() => navigate(ROUTES.COMPANY_POST_JOB)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                      Post Your First Job
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Paginated Company Jobs */}
                        {paginatedJobUpdates.map((job) => (
                          <div key={job.id} className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                            onClick={() => handleJobListingClick}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                                <Building2 className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  job.jobType?.includes('Full') ? 'bg-green-100 text-green-700' : 
                                    job.jobType?.includes('Part') ? 'bg-blue-100 text-blue-700' :
                                      'bg-gray-100 text-gray-700'
                                }`}>
                                  {job.jobType || 'Full-time'}
                                </span>
                              </div>
                            </div>
                        
                            <h4 className="font-medium text-gray-900 mb-1">{job.title}</h4>
                            <p className="text-sm text-gray-600 mb-3">{company?.companyName || 'Company'} - {job.location}</p>
                        
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="px-2 pl-2 text-xs rounded-full bg-orange-100 text-orange-700">
                                {job.experienceLevel || 'Experience Level'}
                              </span>
                              <span className="px-2 pl-2 text-xs rounded-full bg-blue-100 text-blue-700">
                                {job.education || 'Education'}
                              </span>
                              <span className="px-2 pl-2 text-xs rounded-full bg-purple-100 text-purple-700">
                                {job.workLocation || 'Work Location'}
                              </span>
                            </div>
                        
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-500">
                            Posted {new Date(job.createdAt).toLocaleDateString()}
                              </p>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                job.isActive === false || job.status === 'deleted' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {job.isActive === false || job.status === 'deleted' ? 'Inactive' : 'Active'}
                              </span>
                            </div>
                        
                            {job.salary && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <span className="text-sm font-medium text-gray-900">
                              ₹{job.salary.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <EditJobModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        job={selectedJob}
        onJobUpdated={handleJobUpdated}
      />

      <EditCompanyProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        company={company}
        onProfileUpdated={handleProfileUpdated}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDeleteJob}
        onConfirm={confirmDeleteJob}
        title="Delete Job"
        message={`Are you sure you want to delete "${jobToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Job"
        cancelText="Cancel"
        type="danger"
        loading={isDeleting}
      />

      <CompanyDetailsModal
        isOpen={isCompanyDetailsOpen}
        onClose={() => setIsCompanyDetailsOpen(false)}
        company={company}
      />

      {/* Messages Sidebar */}
      {company?.id && (
        <MessagesSidebar
          companyId={company.id}
          isOpen={isMessagesSidebarOpen}
          onClose={() => setIsMessagesSidebarOpen(false)}
          onSelectConversation={(conversation: ConversationResponse) => {
            navigate(`/chat?applicationId=${conversation.applicationId}`);
          }}
        />
      )}
    </div>
  );
};

export default CompanyDashboard;