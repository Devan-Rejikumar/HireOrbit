import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Calendar, 
  MessageSquare, 
  Lock, 
  LogOut, 
  Home,
  Search,
  Briefcase,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { MessagesDropdown } from '@/components/MessagesDropdown';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import AppliedJobs from '@/components/AppliedJobs';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { useTotalUnreadCount, useUserConversations, useMessages, useMarkAsRead } from '@/hooks/useChat';
import { ConversationResponse } from '@/api/chatService';
import api from '@/api/axios';

const UserDashboard = () => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ConversationResponse | null>(null);
  const [otherParticipantName, setOtherParticipantName] = useState<string>('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Get total unread message count
  const { data: totalUnreadMessages = 0 } = useTotalUnreadCount(user?.id || null);
  
  // Get conversations for jobseekers
  const currentUserId = role === 'jobseeker' ? user?.id || '' : '';
  const { data: conversations = [] } = useUserConversations(currentUserId);
  
  // Get messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useMessages(
    selectedConversation?.id || null,
    currentUserId
  );
  
  const markAsReadMutation = useMarkAsRead();

  // Fetch participant name when conversation is selected
  useEffect(() => {
    const fetchOtherParticipantName = async () => {
      if (!selectedConversation || role !== 'jobseeker') {
        setOtherParticipantName('');
        return;
      }

      try {
        let companyName: string | null = null;
        
        try {
          interface ApplicationData {
            companyName?: string;
            jobId?: string;
            job?: {
              companyName?: string;
              company?: string | {
                companyName?: string;
                name?: string;
              };
            };
          }
          
          interface ApplicationResponse {
            success?: boolean;
            data?: ApplicationData;
          }
          
          const appResponse = await api.get<ApplicationResponse>(`/applications/${selectedConversation.applicationId}`);
          const responseData = appResponse.data;
          const applicationData: ApplicationData | undefined = responseData?.data || (responseData as unknown as ApplicationData);
          
          companyName = applicationData?.companyName ||
                      applicationData?.job?.companyName ||
                      (typeof applicationData?.job?.company === 'object' 
                        ? applicationData.job.company.companyName || applicationData.job.company.name 
                        : typeof applicationData?.job?.company === 'string' 
                          ? applicationData.job.company 
                          : null) ||
                      null;
          
          if ((!companyName || companyName === 'Company Name' || companyName === 'Unknown Company') && applicationData?.jobId) {
            try {
              interface JobResponse {
                data?: {
                  job?: {
                    company?: string;
                    companyName?: string;
                  };
                  company?: string;
                  companyName?: string;
                };
                job?: {
                  company?: string;
                  companyName?: string;
                };
                company?: string;
                companyName?: string;
              }
              
              const jobResponse = await api.get<JobResponse>(`/jobs/${applicationData.jobId}`);
              const jobResponseData = jobResponse.data;
              const jobData = jobResponseData?.data?.job || jobResponseData?.job || jobResponseData?.data || jobResponseData;
              
              if (jobData && typeof jobData === 'object') {
                companyName = (jobData as any)?.company?.companyName ||
                            (jobData as any)?.companyName ||
                            (jobData as any)?.company?.name ||
                            (typeof (jobData as any)?.company === 'string' ? (jobData as any)?.company : null) ||
                            null;
              }
            } catch (jobError: any) {
              // Silent fail
            }
          }
          
          if (companyName && companyName !== 'Company Name' && companyName !== 'Unknown Company') {
            setOtherParticipantName(companyName);
            return;
          }
        } catch (appError: any) {
          // Silent fail
        }
        
        setOtherParticipantName('Company');
      } catch (error) {
        console.error('Error fetching participant name:', error);
        setOtherParticipantName('Company');
      }
    };

    fetchOtherParticipantName();
  }, [selectedConversation, role]);

  const handleSelectConversation = (conversation: ConversationResponse) => {
    setSelectedConversation(conversation);
    if (currentUserId) {
      markAsReadMutation.mutate({
        conversationId: conversation.id,
        userId: currentUserId
      });
    }
  };

  const handleSendMessage = () => {
    // This will be handled by ChatWindow component
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home, path: null },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    { id: 'applied-jobs', label: 'Applied Jobs', icon: Briefcase, path: null },
    { id: 'schedule', label: 'My Schedule', icon: Calendar, path: '/schedule' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, path: null, badge: totalUnreadMessages },
    { id: 'password', label: 'Change Password', icon: Lock, path: null },
  ];

  const handleSidebarClick = (item: typeof sidebarItems[0]) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.id === 'password') {
      setIsChangePasswordModalOpen(true);
    } else if (item.id === 'messages') {
      setActiveSection('messages');
    } else {
      setActiveSection(item.id);
      // Reset sidebar collapse when leaving messages section
      if (isSidebarCollapsed) {
        setIsSidebarCollapsed(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search Jobs */}
              <button 
                onClick={() => navigate('/jobs')} 
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
        <aside className={`${isSidebarCollapsed ? 'hidden' : 'w-64'} bg-white shadow-sm border-r border-gray-200 relative transition-all duration-300`}>
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
          {activeSection === 'overview' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.username || 'User'}!</h2>
              <p className="text-gray-600 mb-8">Here's an overview of your account activity.</p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Profile Completion</p>
                      <p className="text-2xl font-bold text-gray-900">85%</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Upcoming Interviews</p>
                      <p className="text-2xl font-bold text-gray-900">2</p>
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
                      <p className="text-2xl font-bold text-gray-900">{totalUnreadMessages}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">View Profile</p>
                      <p className="text-sm text-gray-600">Manage your profile information</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/schedule')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <Calendar className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">My Schedule</p>
                      <p className="text-sm text-gray-600">View your interview schedule</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/jobs')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <Search className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Find Jobs</p>
                      <p className="text-sm text-gray-600">Browse available job opportunities</p>
                    </div>
                  </button>
                  
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

          {activeSection === 'messages' && role === 'jobseeker' && (
            <div className="h-[calc(100vh-68px)] flex -m-6">
              {/* Chat Sidebar */}
              <div className="w-1/3 border-r border-gray-200 bg-white">
                <ChatSidebar
                  conversations={conversations}
                  selectedConversationId={selectedConversation?.id || null}
                  currentUserId={currentUserId}
                  onSelectConversation={handleSelectConversation}
                  role={role}
                />
              </div>

              {/* Chat Window */}
              <div className="flex-1 bg-white">
                {selectedConversation ? (
                  <ChatWindow
                    conversationId={selectedConversation.id}
                    currentUserId={currentUserId}
                    messages={messages}
                    isLoading={messagesLoading}
                    onSendMessage={handleSendMessage}
                    otherParticipantName={otherParticipantName}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-gray-500 text-lg">Select a conversation to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
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

