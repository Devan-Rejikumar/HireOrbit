import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Download, Eye, Loader2, Search, Filter, ChevronUp, ChevronDown, Calendar, Home, MessageSquare, Building2, Briefcase, Calendar as CalendarIcon, CreditCard, Settings, ChevronLeft, ChevronRight, User, X, MessageCircle, FileText } from 'lucide-react';
import { CompanyHeader } from '@/components/CompanyHeader';
import { useTotalUnreadCount } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import { ApiResponse } from '@/types/api';
import ScheduleInterviewModal from '@/components/ScheduleInterviewModal';
import CreateOfferModal from '@/components/CreateOfferModal';
import { _interviewService } from '@/api/interviewService';
import toast from 'react-hot-toast';
import { Pagination } from '@/components/ui/Pagination';
import { subscriptionService } from '@/api/subscriptionService';
import { _applicationService } from '@/api/applicationService';

interface Application {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  jobTitle: string;
  status: string;
  coverLetter: string;
  expectedSalary: string;
  experience: string;
  availability?: string;
  resumeUrl?: string;
  atsScore?: number | null;
  appliedAt: string;
  userProfile?: {
    id?: string;
    userId?: string;
    headline?: string;
    about?: string;
    profilePicture?: string;
    location?: string;
    phone?: string;
    resume?: string;
  };
}

const CompanyApplications = () => {
  const navigate = useNavigate();
  const location = useLocation(); // ADD THIS LINE
  const { company: authCompany } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [noticePeriodFilter, setNoticePeriodFilter] = useState<string>('ALL');
  const [atsScoreFilter, setAtsScoreFilter] = useState<string>('ALL');
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('appliedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingApp, setSchedulingApp] = useState<Application | null>(null);
  const [applicationsWithInterviews, setApplicationsWithInterviews] = useState<Set<string>>(new Set());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // Default to collapsed on mobile, open on desktop
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024; // lg breakpoint
    }
    return true;
  });
  const [company, setCompany] = useState<{ id?: string; companyName?: string; email?: string; profileCompleted?: boolean; isVerified?: boolean; logo?: string } | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedAppForActions, setSelectedAppForActions] = useState<Application | null>(null);
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const [selectedAppForOffer, setSelectedAppForOffer] = useState<Application | null>(null);

  // Get total unread message count
  const { data: totalUnreadMessages = 0 } = useTotalUnreadCount(
    authCompany?.id || null,
  );

  const fetchCompanyProfile = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<any>>('/company/profile');
      setCompany(response.data?.data?.company || null);
    } catch (_error) {
      // Silently handle error
    }
  }, []);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const response = await subscriptionService.getSubscriptionStatus();
      const isActive = response.data?.isActive === true;
      setHasActiveSubscription(isActive);
    } catch (_error) {
      setHasActiveSubscription(false);
    }
  }, []);

  const fetchApplications = useCallback(async (showLoadingBar = false) => {
    try {
      // Only show loading bar if explicitly requested (initial load)
      if (showLoadingBar) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      const params: Record<string, string> = {};
      
      // Add ATS score filter if subscribed and filter is set
      if (hasActiveSubscription && atsScoreFilter !== 'ALL') {
        params.atsScoreMin = atsScoreFilter;
      }
      
      const queryString = new URLSearchParams(params).toString();
      const url = `/applications/company/applications${queryString ? `?${queryString}` : ''}`;
      
      const res = await api.get<{ data?: { applications?: Application[] } }>(url);
      setApplications(res.data.data?.applications || []);
    } catch (_error) {
      setApplications([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [hasActiveSubscription, atsScoreFilter]);

  const fetchInterviewsForApplications = useCallback(async () => {
    try {
      const response = await _interviewService.getCompanyInterviews();
      const interviews = response.data || [];
      
      // Create a set of application IDs that have interviews scheduled
      const appIdsWithInterviews = new Set(interviews.map(interview => interview.applicationId));
      setApplicationsWithInterviews(appIdsWithInterviews);
    } catch (_error) {
      // Silently handle error
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      await checkSubscriptionStatus();
      await fetchApplications(true); // Show loading bar on initial load
      await fetchInterviewsForApplications();
      await fetchCompanyProfile();
    };
    initialize();
  }, [checkSubscriptionStatus, fetchApplications, fetchInterviewsForApplications, fetchCompanyProfile, location.pathname]);
  useEffect(() => {
    // Refetch applications when ATS score filter changes (only if subscription status is known)
    // Only refetch if initial load is complete (loading is false)
    if (hasActiveSubscription !== undefined && !loading) {
      fetchApplications(false); // Don't show loading bar for filter changes
    }
  }, [atsScoreFilter, hasActiveSubscription, loading, fetchApplications]);

  const handleViewResume = useCallback(async (applicantName: string, _resumeUrl?: string, applicationId?: string) => {
    if (!applicationId) {
      toast.error('Application ID not available');
      return;
    }

    try {
      const { resumeUrl } = await _applicationService.viewResume(applicationId);
      const newWindow = window.open(resumeUrl, '_blank');
      if (!newWindow) {
        toast.error('Pop-up blocked! Please allow pop-ups or click Download button instead.');
      }
    } catch (error) {
      toast.error('Failed to load resume');
    }
  }, []);

  const handleDownloadResume = useCallback(async (applicationId: string, applicantName: string, _resumeUrl?: string) => {
    try {
      // Get signed download URL from backend
      const { downloadUrl } = await _applicationService.downloadResume(applicationId);
      
      // Fetch the PDF blob using the signed URL
      const response = await fetch(downloadUrl, {
        method: 'GET',
        credentials: 'omit', // Don't send credentials to avoid CORS issues
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch resume');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${applicantName}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Resume downloaded successfully');
    } catch (error) {
      toast.error('Failed to download resume');
    }
  }, []);

  const handleStatusUpdate = useCallback(async (applicationId: string, newStatus: string) => {
    // Optimistically update the UI immediately
    setApplications(prevApps => 
      prevApps.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus as Application['status'] }
          : app
      )
    );
    
    try {
      await api.put(`/applications/${applicationId}/status`, { 
        status: newStatus,
        reason: `Status updated to ${newStatus}`, 
      });
      // Silently refresh in background without showing loading bar
      fetchApplications(false); 
      toast.success(`Application status updated to ${newStatus}`);
    } catch (error) {
      // Revert optimistic update on error
      fetchApplications(false);
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError?.response?.data?.message || 'Failed to update application status');
    }
  }, [fetchApplications]);

  const handleScheduleInterview = useCallback((app: Application) => {
    setSchedulingApp(app);
    setShowScheduleModal(true);
    setShowActionsModal(false); // Close actions modal when opening schedule modal
  }, []);

  const _handleOpenActionsModal = useCallback((app: Application) => {
    setSelectedAppForActions(app);
    setShowActionsModal(true);
  }, []);

  const handleCloseActionsModal = useCallback(() => {
    setShowActionsModal(false);
    setSelectedAppForActions(null);
  }, []);

  const handleInterviewScheduled = useCallback(() => {
    setShowScheduleModal(false);
    setSchedulingApp(null);
    fetchApplications(false); // Don't show loading bar when refreshing after scheduling
    fetchInterviewsForApplications(); 
     
  }, [fetchApplications, fetchInterviewsForApplications]);

  const handleSort = useCallback((field: string) => {
    setSortField(prev => {
      if (prev === field) {
        setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        return prev;
      } else {
        setSortDirection('asc');
        return field;
      }
    });
  }, []);


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

  // Helper function to get notice period from application availability field
  // Matches the exact values from JobApplicationModal: immediate, 2-weeks, 1-month, 2-months, 3-months
  const getNoticePeriod = (app: Application): string => {
    if (!app.availability) return 'ALL';
    
    const availability = app.availability.toLowerCase().trim();
    
    // Match exact values from the application form
    if (availability === 'immediate') return 'immediate';
    if (availability === '2-weeks' || availability === '2 weeks notice') return '2-weeks';
    if (availability === '1-month' || availability === '1 month notice') return '1-month';
    if (availability === '2-months' || availability === '2 months notice') return '2-months';
    if (availability === '3-months' || availability === '3 months notice') return '3-months';
    
    return 'ALL';
  };

  // Memoize filtered and sorted applications
  const filteredApps = useMemo(() => {
    return applications
      .filter(app => statusFilter === 'ALL' || app.status === statusFilter)
      .filter(app => 
        searchTerm === '' || 
        app.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.userEmail.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .filter(app => {
        if (noticePeriodFilter === 'ALL') return true;
        const noticePeriod = getNoticePeriod(app);
        return noticePeriod === noticePeriodFilter;
      })
      .sort((a, b) => {
        let aValue = a[sortField as keyof Application];
        let bValue = b[sortField as keyof Application];
        
        if (sortField === 'appliedAt') {
          aValue = new Date(a.appliedAt).getTime();
          bValue = new Date(b.appliedAt).getTime();
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
  }, [applications, statusFilter, searchTerm, sortField, sortDirection, noticePeriodFilter]);

  // Paginate filtered applications
  const totalPages = Math.ceil(filteredApps.length / pageSize);
  const paginatedApps = filteredApps.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [statusFilter, noticePeriodFilter, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <CompanyHeader company={company} />

      <div className="flex min-h-screen relative">
        {/* Sidebar */}
        <aside className={`w-64 bg-white shadow-sm border-r border-gray-200 fixed top-[68px] left-0 bottom-0 overflow-y-auto hide-scrollbar transition-all duration-300 z-10 ${isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'} lg:translate-x-0`}>
          <nav className="p-6">
            <div className="space-y-1 mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Main</h3>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_DASHBOARD)}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <Home className="h-5 w-5" />
                Dashboard
              </button>
              <button 
                onClick={() => navigate(ROUTES.CHAT)}
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
              <button onClick={() => navigate(ROUTES.COMPANY_APPLICATIONS)} className="flex items-center gap-3 px-3 py-2 bg-purple-50 text-purple-700 font-medium rounded-lg w-full text-left">
                <User className="h-5 w-5" />
                All Applicants
              </button>
              <button onClick={() => navigate(ROUTES.COMPANY_JOBS)} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
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
                My Offers
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

        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`fixed top-[84px] z-50 bg-white border border-gray-200 rounded-r-lg p-2 shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-50 lg:block ${
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
        
        {/* Mobile Menu Overlay */}
        {!isSidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[5] lg:hidden"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}
        
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className={`fixed top-[84px] left-2 z-50 bg-white border border-gray-200 rounded-lg p-2 shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-50 lg:hidden ${
            isSidebarCollapsed ? 'block' : 'hidden'
          }`}
          aria-label="Show sidebar"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 pt-20 md:pt-[84px] lg:ml-64">
          <div className="mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Total Applicants: {applications.length}</h1>
                <p className="text-sm md:text-base text-gray-600">Manage and review your job applications</p>
              </div>
            </div>
          </div>

          {/* Search and Filters Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 mb-4 md:mb-6">
            <div className="flex flex-col gap-3 md:gap-4">
              {/* Search Bar */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by candidate name, email, or job title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex-1 min-w-[120px] h-9 md:h-10 items-center justify-between rounded-md border border-gray-300 bg-white px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="REVIEWING">Reviewing</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <select
                  value={noticePeriodFilter}
                  onChange={(e) => {
                    setNoticePeriodFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex-1 min-w-[120px] h-9 md:h-10 items-center justify-between rounded-md border border-gray-300 bg-white px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="ALL">All Notice Periods</option>
                  <option value="immediate">Immediate</option>
                  <option value="2-weeks">2 weeks notice</option>
                  <option value="1-month">1 month notice</option>
                  <option value="2-months">2 months notice</option>
                  <option value="3-months">3 months notice</option>
                </select>
                {hasActiveSubscription && (
                  <select
                    value={atsScoreFilter}
                    onChange={(e) => {
                      setAtsScoreFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="flex-1 min-w-[120px] h-9 md:h-10 items-center justify-between rounded-md border border-gray-300 bg-white px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="ALL">All ATS Scores</option>
                    <option value="60">ATS ≥ 60</option>
                    <option value="75">ATS ≥ 75</option>
                    <option value="90">ATS ≥ 90</option>
                  </select>
                )}
              </div>
            </div>
          </div>


          {/* Applications Table */}
          <Card>
            <CardContent className="p-0">
              {paginatedApps.length === 0 ? (
                <div className="p-8 md:p-12 text-center">
                  <Users className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm md:text-base text-gray-500">No applications found</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th 
                            className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-[22%]"
                            onClick={() => handleSort('userName')}
                          >
                            <div className="flex items-center gap-1">
                        Full Name
                              {sortField === 'userName' && (
                                sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                      ATS Score
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-[18%]"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center gap-1">
                        Hiring Stage
                              {sortField === 'status' && (
                                sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-[18%]"
                            onClick={() => handleSort('appliedAt')}
                          >
                            <div className="flex items-center gap-1">
                        Applied Date
                              {sortField === 'appliedAt' && (
                                sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-[22%]"
                            onClick={() => handleSort('jobTitle')}
                          >
                            <div className="flex items-center gap-1">
                        Job Role
                              {sortField === 'jobTitle' && (
                                sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                      Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedApps.map(app => (
                          <tr key={app.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center min-w-0">
                                <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                                  <Users className="h-5 w-5 text-purple-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-gray-900 truncate">{app.userName}</div>
                                  <div className="text-xs text-gray-500 truncate">{app.userEmail}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {hasActiveSubscription ? (
                                app.atsScore !== null && app.atsScore !== undefined && app.atsScore > 0 ? (
                                  <div className="flex items-center">
                                    <span className={`text-sm font-semibold ${
                                      app.atsScore >= 80 ? 'text-green-600' :
                                        app.atsScore >= 60 ? 'text-yellow-600' :
                                          'text-red-600'
                                    }`}>
                                      {Math.round(app.atsScore)}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400" title="ATS score is being calculated or resume was not parseable">
                                    Pending
                                  </span>
                                )
                              ) : (
                                <button
                                  onClick={() => navigate(ROUTES.SUBSCRIPTIONS)}
                                  className="text-xs text-purple-600 hover:text-purple-700 underline"
                                  title="Upgrade to view ATS score"
                                >
                                Upgrade
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={app.status}
                                onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                                className={`px-2 py-1 text-sm font-semibold rounded-full border-0 focus:ring-2 focus:ring-purple-500 ${getStatusColor(app.status)}`}
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="REVIEWING">REVIEWING</option>
                                <option value="SHORTLISTED">SHORTLISTED</option>
                                <option value="ACCEPTED">ACCEPTED</option>
                                <option value="REJECTED">REJECTED</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(app.appliedAt).toLocaleDateString('en-US', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric', 
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 truncate" title={app.jobTitle}>
                              {app.jobTitle}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              <button
                                onClick={() => {
                                  setSelectedAppForActions(app);
                                  setShowActionsModal(true);
                                }}
                                className="text-gray-600 hover:text-gray-900 p-2 rounded hover:bg-gray-100 transition-colors"
                                title="Actions"
                              >
                                <Settings className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                
                  {/* Mobile Card View */}
                  <div className="lg:hidden divide-y divide-gray-200">
                    {paginatedApps.map(app => (
                      <div key={app.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center min-w-0 flex-1">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                              <Users className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">{app.userName}</div>
                              <div className="text-xs text-gray-500 truncate">{app.userEmail}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedAppForActions(app);
                              setShowActionsModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-900 p-1.5 rounded hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
                            title="Actions"
                          >
                            <Settings className="h-5 w-5" />
                          </button>
                        </div>
                      
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Job Role:</span>
                            <span className="font-medium text-gray-900 truncate ml-2">{app.jobTitle}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">ATS Score:</span>
                            {hasActiveSubscription ? (
                              app.atsScore !== null && app.atsScore !== undefined && app.atsScore > 0 ? (
                                <span className={`text-sm font-semibold ${
                                  app.atsScore >= 80 ? 'text-green-600' :
                                    app.atsScore >= 60 ? 'text-yellow-600' :
                                      'text-red-600'
                                }`}>
                                  {Math.round(app.atsScore)}%
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400" title="ATS score is being calculated or resume was not parseable">
                                  Pending
                                </span>
                              )
                            ) : (
                              <button
                                onClick={() => navigate(ROUTES.SUBSCRIPTIONS)}
                                className="text-xs text-purple-600 hover:text-purple-700 underline"
                                title="Upgrade to view ATS score"
                              >
                              Upgrade
                              </button>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Status:</span>
                            <select
                              value={app.status}
                              onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                              className={`px-2 py-1 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-purple-500 ${getStatusColor(app.status)}`}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="REVIEWING">REVIEWING</option>
                              <option value="SHORTLISTED">SHORTLISTED</option>
                              <option value="ACCEPTED">ACCEPTED</option>
                              <option value="REJECTED">REJECTED</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Applied:</span>
                            <span className="text-gray-900">
                              {new Date(app.appliedAt).toLocaleDateString('en-US', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric', 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredApps.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemName="applicants"
            className="mt-6"
          />

          {/* Detail Modal */}
          {selectedApp && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
                <div className="p-4 md:p-6">
                  {/* Modal Header */}
                  <div className="flex justify-between items-start mb-4 md:mb-6">
                    <div className="min-w-0 flex-1 pr-2">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{selectedApp.userName}</h2>
                      <p className="text-sm md:text-base text-purple-600 font-medium truncate">{selectedApp.jobTitle}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedApp(null)}
                      className="text-gray-500 hover:text-gray-700 text-xl md:text-2xl flex-shrink-0"
                    >
                  ✕
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="space-y-4 md:space-y-6">
                    {/* Contact Info */}
                    <div>
                      <h3 className="font-semibold text-base md:text-lg mb-2 md:mb-3">Contact Information</h3>
                      <div className="grid md:grid-cols-2 gap-2 md:gap-4">
                        <p className="flex items-center gap-2 text-sm md:text-base">📧 <span className="break-all">{selectedApp.userEmail}</span></p>
                        {selectedApp.userPhone && <p className="flex items-center gap-2 text-sm md:text-base">📞 <span>{selectedApp.userPhone}</span></p>}
                      </div>
                    </div>

                    {/* Application Details */}
                    <div>
                      <h3 className="font-semibold text-base md:text-lg mb-2 md:mb-3">Application Details</h3>
                      <div className="grid md:grid-cols-2 gap-2 md:gap-4 text-sm md:text-base">
                        <p>💰 Expected Salary: <strong>{selectedApp.expectedSalary}</strong></p>
                        <p>💼 Experience: <strong>{selectedApp.experience}</strong></p>
                        <p>📅 Applied: <strong>{new Date(selectedApp.appliedAt).toLocaleDateString()}</strong></p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span>📊 Status:</span>
                          <select
                            value={selectedApp.status}
                            onChange={(e) => {
                              handleStatusUpdate(selectedApp.id, e.target.value);
                              setSelectedApp({ ...selectedApp, status: e.target.value });
                            }}
                            className="px-2 md:px-3 py-1 border border-gray-300 rounded-lg bg-white text-xs md:text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="REVIEWING">REVIEWING</option>
                            <option value="SHORTLISTED">SHORTLISTED</option>
                            <option value="ACCEPTED">ACCEPTED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Cover Letter */}
                    <div>
                      <h3 className="font-semibold text-base md:text-lg mb-2 md:mb-3">Cover Letter</h3>
                      <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap break-words">{selectedApp.coverLetter}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-4 border-t">
                      {selectedApp.resumeUrl && (
                        <>
                          <Button 
                            onClick={() => handleViewResume(selectedApp.userName, selectedApp.resumeUrl, selectedApp.id)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                        View Resume
                          </Button>
                          <Button 
                            onClick={() => handleDownloadResume(selectedApp.id, selectedApp.userName, selectedApp.resumeUrl)}
                            variant="outline"
                          >
                            <Download className="h-4 w-4 mr-2" />
                        Download Resume
                          </Button>
                        </>
                      )}
                      {selectedApp.status === 'SHORTLISTED' && !applicationsWithInterviews.has(selectedApp.id) && (
                        <Button 
                          onClick={() => handleScheduleInterview(selectedApp)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                      Schedule Interview
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => setSelectedApp(null)}>
                    Close
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Schedule Interview Modal */}
      {schedulingApp && (
        <ScheduleInterviewModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setSchedulingApp(null);
          }}
          applicationId={schedulingApp.id}
          candidateName={schedulingApp.userName}
          jobTitle={schedulingApp.jobTitle}
          onSuccess={handleInterviewScheduled}
        />
      )}

      {/* Actions Modal */}
      {showActionsModal && selectedAppForActions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50" onClick={handleCloseActionsModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-2 md:mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Actions</h3>
                <button
                  onClick={handleCloseActionsModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    navigate(`/chat?applicationId=${selectedAppForActions.id}`);
                    handleCloseActionsModal();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 py-3"
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat
                </Button>
                
                {selectedAppForActions.status === 'SHORTLISTED' && !applicationsWithInterviews.has(selectedAppForActions.id) && (
                  <Button
                    onClick={() => {
                      handleScheduleInterview(selectedAppForActions);
                      handleCloseActionsModal();
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-3"
                  >
                    <Calendar className="h-5 w-5" />
                    Schedule Interview
                  </Button>
                )}
                
                {selectedAppForActions.status === 'ACCEPTED' && (
                  <Button
                    onClick={() => {
                      setSelectedAppForOffer(selectedAppForActions);
                      setShowCreateOfferModal(true);
                      handleCloseActionsModal();
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 py-3"
                  >
                    <FileText className="h-5 w-5" />
                    Send Offer Letter
                  </Button>
                )}
                
                <Button
                  onClick={() => {
                    setSelectedApp(selectedAppForActions);
                    handleCloseActionsModal();
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 py-3"
                >
                  <Eye className="h-5 w-5" />
                  See Application
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Offer Modal */}
      {showCreateOfferModal && selectedAppForOffer && (
        <CreateOfferModal
          isOpen={showCreateOfferModal}
          onClose={() => {
            setShowCreateOfferModal(false);
            setSelectedAppForOffer(null);
          }}
          applicationId={selectedAppForOffer.id}
          candidateName={selectedAppForOffer.userName || 'Candidate'}
          jobTitle={selectedAppForOffer.jobTitle || 'Position'}
          onSuccess={() => {
            fetchApplications();
          }}
        />
      )}
    </div>
  );
};

export default CompanyApplications;
