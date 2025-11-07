import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Briefcase, Plus, LogOut, UserCheck, MapPin, Edit, Trash2, ChevronLeft, ChevronRight, TrendingUp, Calendar, CheckCircle, AlertCircle, Settings, BarChart3, Eye, FileText, Star, Mail, Home, MessageSquare, User, GraduationCap, Clock, CreditCard, HelpCircle, Bell, ChevronDown, ArrowRight, Calendar as CalendarIcon } from 'lucide-react';
import api from '@/api/axios';
import EditJobModal from '@/components/EditJobModal';
import EditCompanyProfileModal from '@/components/EditCompanyProfileModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import CompanyDetailsModal from '@/components/CompanyDetailsModal';
import { MessagesSidebar } from '@/components/MessagesSidebar';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { useTotalUnreadCount, useCompanyConversations, useMarkAsRead, useMessages } from '@/hooks/useChat';
import { ConversationResponse } from '@/api/_chatService';

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
    totalApplicants: 0
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

  // Get total unread message count
  const { data: totalUnreadMessages = 0 } = useTotalUnreadCount(company?.id || null);
  
  // Get all conversations to find ones with unread messages
  const { data: allConversations = [] } = useCompanyConversations(company?.id || '');
  
  // Get messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useMessages(
    selectedConversation?.id || null,
    company?.id || ''
  );
  const markAsReadMutation = useMarkAsRead();

  useEffect(() => {
    fetchCompanyProfile();
    fetchJobCount();
  }, []);

  useEffect(() => {
    if (company?.companyName) {
      fetchJobs();
      setSelectedCompany(company.companyName);
    }
  }, [company?.companyName]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const activeJobs = jobs.filter(job => job.isActive !== false && job.status !== 'deleted');
      const totalJobs = jobs.length;
      
      setDashboardStats(prevStats => {
        // Calculate deterministic values based on jobs (no random numbers to prevent infinite loops)
        const newStats = {
          newCandidates: Math.floor(totalJobs * 12) + 5, // Based on actual jobs
          scheduleToday: Math.floor(totalJobs * 0.3) + 1, // Interviews scheduled
          messagesReceived: Math.floor(activeJobs.length * 8) + 3,
          jobViews: totalJobs * 180 + (totalJobs % 200), // Deterministic based on job count
          jobApplied: totalJobs * 20 + (totalJobs % 100), // Deterministic based on job count
          jobsOpened: activeJobs.length, // Active jobs
          totalApplicants: totalJobs * 15 + (totalJobs % 30) // Deterministic based on job count
        };
        
        // Check if stats actually changed (compare all values)
        if (
          prevStats.newCandidates === newStats.newCandidates &&
          prevStats.scheduleToday === newStats.scheduleToday &&
          prevStats.messagesReceived === newStats.messagesReceived &&
          prevStats.jobViews === newStats.jobViews &&
          prevStats.jobApplied === newStats.jobApplied &&
          prevStats.jobsOpened === newStats.jobsOpened &&
          prevStats.totalApplicants === newStats.totalApplicants
        ) {
          return prevStats; // Return previous state to prevent re-render
        }
        
        return newStats;
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, [jobs]);

  useEffect(() => {
    // Update stats when jobs data changes
    fetchDashboardStats();
  }, [jobs, fetchDashboardStats]);

  const fetchCompanyProfile = async () => {
    try {
      console.log('🚀 CompanyDashboard: Fetching company profile...');
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
        console.log('✅ CompanyDashboard: Valid response structure found');
        setCompany(response.data.data.company);
        setProfileStep(response.data.data.profileStep || null);
        console.log('🏢 CompanyDashboard: Company data set:', response.data.data.company);
      } else if (response.data && response.data.company) {
        console.log('✅ CompanyDashboard: Direct company structure found');
        setCompany(response.data.company);
        setProfileStep(response.data.profileStep || null);
      } else {
        console.error('❌ CompanyDashboard: Invalid response structure');
        console.error('❌ CompanyDashboard: Expected structure: { success: true, data: { company: {...} } } or { company: {...} }');
        console.error('❌ CompanyDashboard: Actual structure:', response.data);
        setCompany(null);
        setProfileStep(null);
      }
    } catch (error) {
      console.error('❌ CompanyDashboard: Error fetching company profile:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        console.error('❌ CompanyDashboard: Error response:', axiosError.response);
        console.error('❌ CompanyDashboard: Error data:', axiosError.response?.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchJobCount = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: { count: number } }>('/company/job-count');
      setJobCount(response.data.data.count || 0);
    } catch (error) {
      console.error('Error fetching job count:', error);
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
      console.error('Error fetching jobs:', error);
      setJobs([]);
    }
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
      console.error('Error deleting job:', error);
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
    console.log('Edit profile button clicked!');
    console.log('Current company data:', company);
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
    navigate('/company/jobs');
  };

  const handleMessagesClick = async () => {
    // Simple: Mark all conversations as read when Messages is clicked
    if (company?.id && allConversations.length > 0) {
      // Mark all conversations as read (don't check unread count - just mark all)
      const markAllPromises = allConversations.map(conv =>
        markAsReadMutation.mutateAsync({
          conversationId: conv.id,
          userId: company.id
        })
      );
      
      // Don't wait for all to complete - just start them
      Promise.all(markAllPromises).catch(error => {
        console.error('Error marking messages as read:', error);
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
        userId: company.id
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
    navigate('/login', { replace: true });
  };

  const handleCompleteProfile = () => {
    navigate('/company/profile-setup');
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
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Hire Orbit Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Hire Orbit</span>
            </div>
            
            {/* Company Info */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Company</span >
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{company?.companyName || 'Company'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
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
                    navigate('/company/post-job');
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
                      ? "Complete your profile to post jobs"
                      : !company?.isVerified 
                      ? "Awaiting admin approval to post jobs"
                      : "Complete profile and get approval to post jobs"
                    }
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/company/review-status')}
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
        <aside className={`${isSidebarCollapsed ? 'hidden' : 'w-64'} bg-white shadow-sm border-r border-gray-200 relative transition-all duration-300`}>
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
              <button onClick={() => navigate('/company/applications')} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                <User className="h-5 w-5" />
                All Applicants
              </button>
              <button onClick={handleJobListingClick} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
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
              <button className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
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
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                <HelpCircle className="h-5 w-5" />
                Help Center
              </a>
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
        <main className="flex-1 p-6">
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
                <p className="text-sm text-gray-500">Showing job statistics Jul 19-25</p>
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
                {/* Placeholder for bar chart */}
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Bar chart showing job views and applications</p>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                    <span className="text-sm text-gray-600">Job View</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span className="text-sm text-gray-600">Job Applied</span>
                  </div>
                </div>
              </div>
              
              {/* Job Views and Applied Cards */}
              <div className="w-64 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Eye className="h-6 w-6 text-yellow-600" />
                    <span className="font-medium text-gray-900">Job Views</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{dashboardStats.jobViews.toLocaleString()}</div>
                  <div className="text-sm text-green-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    This Week 6.4% ▲
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="h-6 w-6 text-purple-600" />
                    <span className="font-medium text-gray-900">Job Applied</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{dashboardStats.jobApplied}</div>
                  <div className="text-sm text-red-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1 rotate-180" />
                    This Week 0.5% ▼
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applicants Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Applicants Summary
                </h3>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">{dashboardStats.totalApplicants}</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Full Time</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">45</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Part-Time</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Remote</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">22</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Internship</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">32</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Contract</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">30</span>
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
                      onClick={() => navigate('/company/post-job')}
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