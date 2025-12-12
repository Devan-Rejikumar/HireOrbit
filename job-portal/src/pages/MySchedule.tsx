import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Video, Phone, Loader2, CheckCircle, XCircle, User, MessageSquare, Lock, LogOut, Home, Search, Briefcase, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { _interviewService, InterviewWithDetails } from '@/api/interviewService';
import toast from 'react-hot-toast';
import { NotificationBell } from '@/components/NotificationBell';
import { MessagesDropdown } from '@/components/MessagesDropdown';
import { useTotalUnreadCount } from '@/hooks/useChat';

const MySchedule = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [interviews, setInterviews] = useState<InterviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInterviews, setTotalInterviews] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const itemsPerPage = 10;
  const { data: totalUnreadMessages = 0 } = useTotalUnreadCount(user?.id || null);

  useEffect(() => {
    if (role !== 'jobseeker') {
      navigate(ROUTES.HOME);
      return;
    }
  }, [role, navigate]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchInterviews();
  }, [currentPage, statusFilter]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError('');
      const status = statusFilter !== 'all' ? statusFilter : undefined;
      const response = await _interviewService.getCandidateInterviews(currentPage, itemsPerPage, status);
      const interviewsList = response.data?.interviews || response.data || [];
      setInterviews(interviewsList);
      setTotalInterviews(response.data?.pagination?.total || interviewsList.length);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (err: unknown) {
      console.error('Failed to fetch interviews:', err);
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { message?: string } } }) : null;
      setError(axiosError?.response?.data?.message || 'Failed to load interviews');
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ONLINE': return <Video className="w-5 h-5" />;
      case 'OFFLINE': return <MapPin className="w-5 h-5" />;
      case 'PHONE': return <Phone className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home, path: '/user/dashboard' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    { id: 'applied-jobs', label: 'Applied Jobs', icon: Briefcase, path: '/applied-jobs' },
    { id: 'schedule', label: 'My Schedule', icon: Calendar, path: '/schedule' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/user/dashboard', badge: totalUnreadMessages },
    { id: 'password', label: 'Change Password', icon: Lock, path: null },
  ];

  const handleSidebarClick = (item: typeof sidebarItems[0]) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  const isActive = (itemId: string) => {
    if (itemId === 'applied-jobs') return location.pathname === '/applied-jobs';
    if (itemId === 'schedule') return location.pathname === '/schedule';
    if (itemId === 'profile') return location.pathname === '/profile';
    if (itemId === 'overview') return location.pathname === '/user/dashboard';
    return false;
  };

  // Client-side search filtering
  const filteredInterviews = useMemo(() => {
    let filtered = interviews;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (interview) =>
          interview.jobTitle?.toLowerCase().includes(searchLower) ||
          interview.companyName?.toLowerCase().includes(searchLower) ||
          interview.status.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [interviews, searchTerm]);

  const upcomingInterviews = filteredInterviews.filter(interview => 
    new Date(interview.scheduledAt) > new Date() && 
    interview.status !== 'CANCELLED' && 
    interview.status !== 'COMPLETED'
  );

  const pastInterviews = filteredInterviews.filter(interview => 
    new Date(interview.scheduledAt) <= new Date() || 
    interview.status === 'CANCELLED' || 
    interview.status === 'COMPLETED'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  if (role !== 'jobseeker') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(ROUTES.JOBS)} 
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                title="Search Jobs"
              >
                <Search className="h-5 w-5" />
              </button>
              
              <NotificationBell />
              
              {user?.id && (
                <MessagesDropdown userId={user.id} />
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
                const active = isActive(item.id);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSidebarClick(item)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${
                      active
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
          </nav>
          
          {/* User Info at Bottom */}
          <div className="absolute bottom-6 left-6 right-6">
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
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
                <p className="text-gray-600">Manage your upcoming and past interviews</p>
              </div>
              <div className="text-sm text-gray-500">
                {totalInterviews} interview{totalInterviews !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by job title, company, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="SELECTED">Selected</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchInterviews}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-blue-600" />
              Upcoming Interviews ({upcomingInterviews.length})
            </h2>
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => {
                const { date, time } = formatDateTime(interview.scheduledAt);
                return (
                  <div key={interview.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {interview.jobTitle}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(interview.status)}`}>
                            {interview.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">at {interview.companyName}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getTypeIcon(interview.type)}
                            <span className="capitalize">{interview.type.toLowerCase()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{interview.duration} minutes</span>
                          </div>
                        </div>
                        {interview.location && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{interview.location}</span>
                          </div>
                        )}
                        {/* Show both WebRTC Join Call and External Meeting Link (if provided) */}
                        {interview.type === 'ONLINE' && interview.status === 'CONFIRMED' && (
                          <div className="mt-3 flex items-center gap-3">
                            <Button
                              size="sm"
                              onClick={() => navigate(`/interview/${interview.id}/video`)}
                              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                            >
                              <Video className="w-4 h-4" />
                              Join Call
                            </Button>
                            {interview.meetingLink && (
                              <a
                                href={interview.meetingLink.startsWith('http') ? interview.meetingLink : `https://${interview.meetingLink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm underline"
                                title="Use external meeting link as fallback"
                              >
                                <Video className="w-4 h-4" />
                                Join External Meeting
                              </a>
                            )}
                          </div>
                        )}
                        {interview.meetingLink && interview.type !== 'ONLINE' && (
                          <div className="mt-2">
                            <a
                              href={interview.meetingLink.startsWith('http') ? interview.meetingLink : `https://${interview.meetingLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm underline"
                            >
                              <Video className="w-4 h-4" />
                              Join Meeting
                            </a>
                          </div>
                        )}
                        {interview.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">
                              <strong>Notes:</strong> {interview.notes}
                            </p>
                          </div>
                        )}

                        {/* Interview Decision Info for Upcoming */}
                        {(interview.status === 'SELECTED' || interview.status === 'REJECTED') && (
                          <div className={`mt-3 p-3 rounded-md border-l-4 ${
                            interview.status === 'SELECTED' 
                              ? 'bg-green-50 border-green-400' 
                              : 'bg-red-50 border-red-400'
                          }`}>
                            <div className="flex items-start gap-2">
                              {interview.status === 'SELECTED' ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <div className={`font-medium text-sm ${
                                  interview.status === 'SELECTED' ? 'text-green-800' : 'text-red-800'
                                }`}>
                                  Interview Result: <span className="capitalize">{interview.status.toLowerCase()}</span>
                                </div>
                                {interview.decisionReason && (
                                  <div className="mt-1 text-sm text-gray-700">
                                    <strong>Reason:</strong> {interview.decisionReason}
                                  </div>
                                )}
                                {interview.feedback && (
                                  <div className="mt-1 text-sm text-gray-700">
                                    <strong>Feedback:</strong> {interview.feedback}
                                  </div>
                                )}
                                {interview.decidedAt && (
                                  <div className="mt-1 text-xs text-gray-500">
                                    Decision made: {new Date(interview.decidedAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Interviews */}
      {pastInterviews.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-gray-600" />
              Past Interviews ({pastInterviews.length})
            </h2>
            <div className="space-y-4">
              {pastInterviews.map((interview) => {
                const { date, time } = formatDateTime(interview.scheduledAt);
                return (
                  <div key={interview.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-700">
                            {interview.jobTitle}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(interview.status)}`}>
                            {interview.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">at {interview.companyName}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getTypeIcon(interview.type)}
                            <span className="capitalize">{interview.type.toLowerCase()}</span>
                          </div>
                        </div>
                        {interview.location && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{interview.location}</span>
                          </div>
                        )}
                        {interview.meetingLink && (
                          <div className="mt-2">
                            <a
                              href={interview.meetingLink.startsWith('http') ? interview.meetingLink : `https://${interview.meetingLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm underline"
                            >
                              <Video className="w-4 h-4" />
                              Join Meeting
                            </a>
                          </div>
                        )}
                        {interview.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">
                              <strong>Notes:</strong> {interview.notes}
                            </p>
                          </div>
                        )}

                        {/* Interview Decision Info */}
                        {(interview.status === 'SELECTED' || interview.status === 'REJECTED') && (
                          <div className={`mt-3 p-3 rounded-md border-l-4 ${
                            interview.status === 'SELECTED' 
                              ? 'bg-green-50 border-green-400' 
                              : 'bg-red-50 border-red-400'
                          }`}>
                            <div className="flex items-start gap-2">
                              {interview.status === 'SELECTED' ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <div className={`font-medium text-sm ${
                                  interview.status === 'SELECTED' ? 'text-green-800' : 'text-red-800'
                                }`}>
                                  Interview Result: <span className="capitalize">{interview.status.toLowerCase()}</span>
                                </div>
                                {interview.decisionReason && (
                                  <div className="mt-1 text-sm text-gray-700">
                                    <strong>Reason:</strong> {interview.decisionReason}
                                  </div>
                                )}
                                {interview.feedback && (
                                  <div className="mt-1 text-sm text-gray-700">
                                    <strong>Feedback:</strong> {interview.feedback}
                                  </div>
                                )}
                                {interview.decidedAt && (
                                  <div className="mt-1 text-xs text-gray-500">
                                    Decision made: {new Date(interview.decidedAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredInterviews.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No interviews scheduled</h3>
            <p className="text-gray-600">
              You don't have any interviews scheduled yet. Keep applying to jobs to get interview opportunities!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!loading && filteredInterviews.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalInterviews)} of {totalInterviews} interviews
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
};

export default MySchedule;
