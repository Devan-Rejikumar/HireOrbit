import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Download, Eye, ArrowLeft, Loader2, Search, Filter, Star, MoreHorizontal, ChevronUp, ChevronDown, Calendar, Home, MessageSquare, Building2, Briefcase, Calendar as CalendarIcon, CreditCard, Settings, ChevronLeft, ChevronRight, User, X, MessageCircle } from 'lucide-react';
import { CompanyHeader } from '@/components/CompanyHeader';
import { useTotalUnreadCount } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
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
  const { company: authCompany } = useAuth();
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
  const [company, setCompany] = useState<{ id?: string; companyName?: string; email?: string; profileCompleted?: boolean; isVerified?: boolean; logo?: string } | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedAppForActions, setSelectedAppForActions] = useState<Application | null>(null);

  // Get total unread message count
  const { data: totalUnreadMessages = 0 } = useTotalUnreadCount(
    authCompany?.id || null
  );

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
        reason: `Status updated to ${newStatus}`, 
      });
      fetchApplications(); 
    } catch (error) {
      console.error(' Error updating status:', error);
    }
     
  }, []);

  const handleScheduleInterview = useCallback((app: Application) => {
    setSchedulingApp(app);
    setShowScheduleModal(true);
    setShowActionsModal(false); // Close actions modal when opening schedule modal
  }, []);

  const handleOpenActionsModal = useCallback((app: Application) => {
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
    fetchApplications(); 
    fetchInterviewsForApplications(); 
     
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
        app.userEmail.toLowerCase().includes(searchTerm.toLowerCase()),
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
      <CompanyHeader company={company} />

      <div className="flex min-h-screen relative">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 fixed top-[68px] left-0 bottom-0 overflow-y-auto transition-all duration-300 z-10">
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
          </nav>
          
          <div className="absolute bottom-3 left-6 right-6">
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
        <main className="flex-1 p-6 pt-[84px] ml-64">
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
                <div className={filteredApps.length > 10 ? 'overflow-y-auto max-h-[600px]' : ''}>
                  <table className="w-full table-fixed">
                    <thead className="bg-gray-50 border-b sticky top-0 z-10">
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
                      Score
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
                      {filteredApps.map(app => (
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
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              <span className="text-sm text-gray-900">4.5</span>
                            </div>
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
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {filteredApps.length > 10 && (
            <div className="mt-6 flex items-center justify-end">
              <div className="flex items-center gap-4">
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
                              setSelectedApp({ ...selectedApp, status: e.target.value });
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

      {/* Actions Modal */}
      {showActionsModal && selectedAppForActions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseActionsModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
};

export default CompanyApplications;
