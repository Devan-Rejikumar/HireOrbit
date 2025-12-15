import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, Calendar, MessageSquare, Lock, LogOut, Home, Search, Briefcase, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { MessagesDropdown } from '@/components/MessagesDropdown';
import { useTotalUnreadCount, useUserConversations, useMessages, useMarkAsRead } from '@/hooks/useChat';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { ConversationResponse } from '@/api/chatService';
import api from '@/api/axios';

const MessagesPage = () => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: totalUnreadMessages = 0 } = useTotalUnreadCount(user?.id || null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationResponse | null>(null);
  const [otherParticipantName, setOtherParticipantName] = useState<string>('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  if (!user?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // Get conversations for jobseekers
  const currentUserId = role === 'jobseeker' ? user?.id || '' : '';
  const { data: conversations = [] } = useUserConversations(currentUserId);
  
  // Get messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useMessages(
    selectedConversation?.id || null,
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
                interface JobData {
                  company?: {
                    companyName?: string;
                    name?: string;
                  } | string;
                  companyName?: string;
                }
                const typedJobData = jobData as JobData;
                companyName = (typeof typedJobData?.company === 'object' ? typedJobData.company?.companyName : null) ||
                            typedJobData?.companyName ||
                            (typeof typedJobData?.company === 'object' ? typedJobData.company?.name : null) ||
                            (typeof typedJobData?.company === 'string' ? typedJobData.company : null) ||
                            null;
              }
            } catch (jobError: unknown) {
              // Silent fail
            }
          }
          
          if (companyName && companyName !== 'Company Name' && companyName !== 'Unknown Company') {
            setOtherParticipantName(companyName);
            return;
          }
        } catch (appError: unknown) {
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
        userId: currentUserId,
      });
    }
  };

  const handleSendMessage = () => {
    // This will be handled by ChatWindow component
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home, path: '/user/dashboard' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    { id: 'applied-jobs', label: 'Applied Jobs', icon: Briefcase, path: '/applied-jobs' },
    { id: 'schedule', label: 'My Schedule', icon: Calendar, path: '/schedule' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/messages', badge: totalUnreadMessages },
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
    if (itemId === 'messages') return location.pathname === '/messages';
    return false;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/jobs')} 
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

      <div className="flex min-h-screen relative">
        {/* Sidebar */}
        <aside className={`${isSidebarCollapsed ? 'hidden' : 'w-64'} bg-white shadow-sm border-r border-gray-200 relative transition-all duration-300`}>
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
          {role === 'jobseeker' && (
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
    </div>
  );
};

export default MessagesPage;

