import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Download, Eye, ArrowLeft, Loader2, Search, Filter, Star, MoreHorizontal, ChevronUp, ChevronDown, Calendar, Home, MessageSquare, Building2, Briefcase, Calendar as CalendarIcon, CreditCard, HelpCircle, Settings, ChevronLeft, ChevronRight, User, Bell, LogOut, Plus } from 'lucide-react';
import api from '@/api/axios';
import ScheduleInterviewModal from '@/components/ScheduleInterviewModal';
import { _interviewService } from '@/api/interviewService';
import { ChatButton } from '@/components/ChatButton';

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
  resumeUrl?: string;
  appliedAt: string;
  userProfile?: unknown;
}

const CompanyApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('appliedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingApp, setSchedulingApp] = useState<Application | null>(null);
  const [applicationsWithInterviews, setApplicationsWithInterviews] = useState<Set<string>>(new Set());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [company, setCompany] = useState<{ companyName?: string; email?: string; profileCompleted?: boolean; isVerified?: boolean } | null>(null);

  useEffect(() => {
      fetchApplications();
      fetchInterviewsForApplications();
      fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      const response = await api.get('/company/profile');
      setCompany(response.data?.data?.company || null);
    } catch (error) {
      console.error('Error fetching company profile:', error);
    }
  };

  const handleLogout = async () => {
    navigate('/login', { replace: true });
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data?: { applications?: Application[] } }>('/applications/company/applications');
      console.log('📥 Applications response:', res.data);
      setApplications(res.data.data?.applications || []);
    } catch (error) {
      console.error('❌ Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviewsForApplications = async () => {
    try {
      const response = await _interviewService.getCompanyInterviews();
      const interviews = response.data || [];
      
      // Create a set of application IDs that have interviews scheduled
      const appIdsWithInterviews = new Set(interviews.map(interview => interview.applicationId));
      setApplicationsWithInterviews(appIdsWithInterviews);
    } catch (error) {
      console.error('❌ Error fetching interviews:', error);
    }
  };

  const handleViewResume = useCallback(async (applicantName: string, resumeUrl?: string, applicationId?: string) => {
    if (!resumeUrl) return;
    
    const newWindow = window.open(resumeUrl, '_blank');
    if (!newWindow) {
      alert('Pop-up blocked! Please allow pop-ups or click Download button instead.');
    }
  }, []);

  const handleDownloadResume = useCallback((resumeUrl?: string) => {
    if (resumeUrl) {
      const downloadUrl = resumeUrl.replace('/upload/', '/upload/fl_attachment/');
      window.open(downloadUrl, '_blank');
    }
  }, []);

  const handleStatusUpdate = useCallback(async (applicationId: string, newStatus: string) => {
    try {
      await api.put(`/applications/${applicationId}/status`, { 
        status: newStatus,
        reason: `Status updated to ${newStatus}` 
      });
      fetchApplications(); 
    } catch (error) {
      console.error(' Error updating status:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScheduleInterview = useCallback((app: Application) => {
    setSchedulingApp(app);
    setShowScheduleModal(true);
  }, []);

  const handleInterviewScheduled = useCallback(() => {
    setShowScheduleModal(false);
    setSchedulingApp(null);
    fetchApplications(); 
    fetchInterviewsForApplications(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Memoize filtered and sorted applications
  const filteredApps = useMemo(() => {
    return applications
      .filter(app => statusFilter === 'ALL' || app.status === statusFilter)
      .filter(app => 
        searchTerm === '' || 
        app.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      )
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
  }, [applications, statusFilter, searchTerm, sortField, sortDirection]);

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
              <span className="text-sm text-gray-600">Company</span>
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
        <aside className={`${isSidebarCollapsed ? 'hidden' : 'w-64'} bg-white shadow-sm border-r border-gray-200 relative`}>
          <nav className="p-6">
            <div className="space-y-1 mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Main</h3>
              <button 
                type="button"
                onClick={() => navigate('/company/dashboard')}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left whitespace-nowrap"
              >
                <Home className="h-5 w-5" />
                Dashboard
              </button>
              <button 
                type="button"
                onClick={() => navigate('/chat')}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left whitespace-nowrap"
              >
                <MessageSquare className="h-5 w-5" />
                Messages
              </button>
              <button 
                type="button"
                onClick={() => navigate('/company/dashboard')}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left whitespace-nowrap"
              >
                <Building2 className="h-5 w-5" />
                Company Profile
              </button>
              <button 
                type="button"
                className="flex items-center gap-3 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium w-full text-left whitespace-nowrap"
                disabled
              >
                <User className="h-5 w-5" />
                All Applicants
              </button>
              <button 
                type="button"
                onClick={() => navigate('/company/jobs')}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left whitespace-nowrap"
              >
                <Briefcase className="h-5 w-5" />
                Job Listing
              </button>
              <button 
                type="button"
                onClick={() => navigate('/company/interviews')}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left whitespace-nowrap"
              >
                <CalendarIcon className="h-6 w-6" />
                Interview Management
              </button>
              <button 
                type="button"
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left whitespace-nowrap"
                disabled
              >
                <CreditCard className="h-5 w-5" />
                Plans & Billing
              </button>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Setting</h3>
              <button 
                type="button"
                onClick={() => navigate('/company/settings')} 
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left whitespace-nowrap"
              >
                <Settings className="h-5 w-5" />
                Settings
              </button>
              <button 
                type="button"
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left whitespace-nowrap"
                disabled
              >
                <HelpCircle className="h-5 w-5" />
                Help Center
              </button>
            </div>
          </nav>
          
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium">{company?.companyName || 'Company'}</div>
                <div className="text-xs text-gray-500">{company?.email || 'email@company.com'}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Toggle Sidebar Button */}
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

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Total Applicants: {applications.length}</h1>
                <p className="text-gray-600">Manage and review your job applications</p>
              </div>
            </div>
          </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search Applicants"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['ALL', 'PENDING', 'REVIEWING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === status 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {status} ({applications.filter(a => status === 'ALL' || a.status === status).length})
          </button>
        ))}
      </div>


      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          {filteredApps.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('userName')}
                    >
                      <div className="flex items-center gap-1">
                        Full Name
                        {sortField === 'userName' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('jobTitle')}
                    >
                      <div className="flex items-center gap-1">
                        Job Role
                        {sortField === 'jobTitle' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApps.map(app => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <Users className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{app.userName}</div>
                            <div className="text-sm text-gray-500">{app.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm text-gray-900">4.5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(app.appliedAt).toLocaleDateString('en-US', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {app.jobTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => setSelectedApp(app)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            See Application
                          </Button>
                          {app.status === 'SHORTLISTED' && !applicationsWithInterviews.has(app.id) && (
                            <Button
                              size="sm"
                              onClick={() => handleScheduleInterview(app)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Schedule
                            </Button>
                          )}
                          {app.status === 'SHORTLISTED' && (
                            <ChatButton applicationId={app.id} size="sm" />
                          )}
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {filteredApps.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            View 10 Applicants per page
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="bg-purple-600 text-white border-purple-600">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
              <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedApp.userName}</h2>
                  <p className="text-purple-600 font-medium">{selectedApp.jobTitle}</p>
                </div>
                <button 
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-6">
                {/* Contact Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Contact Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <p className="flex items-center gap-2">📧 <span>{selectedApp.userEmail}</span></p>
                    {selectedApp.userPhone && <p className="flex items-center gap-2">📞 <span>{selectedApp.userPhone}</span></p>}
                  </div>
                </div>

                {/* Application Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Application Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <p>💰 Expected Salary: <strong>{selectedApp.expectedSalary}</strong></p>
                    <p>💼 Experience: <strong>{selectedApp.experience}</strong></p>
                    <p>📅 Applied: <strong>{new Date(selectedApp.appliedAt).toLocaleDateString()}</strong></p>
                    <div className="flex items-center gap-2">
                      <span>📊 Status:</span>
                      <select
                        value={selectedApp.status}
                        onChange={(e) => {
                          handleStatusUpdate(selectedApp.id, e.target.value);
                          setSelectedApp({...selectedApp, status: e.target.value});
                        }}
                        className="px-3 py-1 border border-gray-300 rounded-lg bg-white text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                  <h3 className="font-semibold text-lg mb-3">Cover Letter</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApp.coverLetter}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
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
                        onClick={() => handleDownloadResume(selectedApp.resumeUrl)}
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
    </div>
  );
};

export default CompanyApplications;
