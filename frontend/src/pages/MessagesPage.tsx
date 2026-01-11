import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search, ArrowLeft, Home, Briefcase, User } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { MessagesDropdown } from '@/components/MessagesDropdown';
import { useTotalUnreadCount, useUserConversations, useMessages, useMarkAsRead } from '@/hooks/useChat';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { ConversationResponse } from '@/api/chatService';
import api from '@/api/axios';
import Header from '@/components/Header';

const MessagesPage = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  useTotalUnreadCount(user?.id || null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationResponse | null>(null);
  const [otherParticipantName, setOtherParticipantName] = useState<string>('');

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
            } catch {
              // Silent fail
            }
          }
          
          if (companyName && companyName !== 'Company Name' && companyName !== 'Unknown Company') {
            setOtherParticipantName(companyName);
            return;
          }
        } catch {
          // Silent fail
        }
        
        setOtherParticipantName('Company');
      } catch {
        setOtherParticipantName('Company');
      }
    };

    fetchOtherParticipantName();
  }, [selectedConversation, role]);

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
    // No action needed - WebSocket handles real-time updates
  };

  // Handle back button on mobile
  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header - Hidden on mobile when chat is open */}
      <div className={`${selectedConversation ? 'hidden lg:block' : 'block'}`}>
        <Header />
      </div>

      {/* Mobile Chat Header - Only shown when chat is open */}
      {selectedConversation && (
        <header className="lg:hidden bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBackToList}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-semibold text-gray-900 truncate">{otherParticipantName || 'Chat'}</h1>
                <p className="text-xs text-gray-500">Tap for info</p>
              </div>
              <NotificationBell />
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {role === 'jobseeker' && (
          <div className="h-screen lg:h-[calc(100vh-64px)] lg:pt-16 flex relative">
            {/* Chat Sidebar - Full screen on mobile, sidebar on desktop */}
            <div className={`
              ${selectedConversation ? 'hidden lg:block' : 'block'}
              w-full lg:w-80 xl:w-96 
              bg-white border-r border-gray-200
              fixed lg:sticky top-14 sm:top-16 lg:top-0 
              left-0 right-0 lg:right-auto
              h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] lg:h-full
              z-30 lg:z-0
              overflow-hidden
            `}>
              {/* Mobile Search Header */}
              <div className="lg:hidden px-4 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate('/jobs')} 
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Search className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="h-[calc(100%-60px)] lg:h-full overflow-hidden">
                <ChatSidebar
                  conversations={conversations}
                  selectedConversationId={selectedConversation?.id || null}
                  currentUserId={currentUserId}
                  onSelectConversation={handleSelectConversation}
                  role={role}
                />
              </div>
            </div>

            {/* Chat Window - Full screen on mobile, main area on desktop */}
            <div className={`
              ${selectedConversation ? 'block' : 'hidden lg:block'}
              flex-1 bg-white
              fixed lg:relative 
              inset-0 lg:inset-auto
              ${selectedConversation ? 'pt-14' : ''} lg:pt-0
              z-20 lg:z-0
            `}>
              {selectedConversation ? (
                <div className="h-full">
                  <ChatWindow
                    conversationId={selectedConversation.id}
                    currentUserId={currentUserId}
                    messages={messages}
                    isLoading={messagesLoading}
                    onSendMessage={handleSendMessage}
                    otherParticipantName={otherParticipantName}
                    otherParticipantId={selectedConversation.companyId}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
                  <div className="text-center px-6">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <MessageSquare className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Messages</h2>
                    <p className="text-gray-500 max-w-sm">Select a conversation from the sidebar to start chatting with employers</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation - Only show when on conversation list */}
      {!selectedConversation && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
          <div className="flex items-center justify-around py-2">
            <button
              onClick={() => navigate('/user/dashboard')}
              className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-colors min-w-[60px] text-gray-500"
            >
              <Home className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">Home</span>
            </button>
            
            <button
              onClick={() => navigate('/jobs')}
              className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 transition-colors min-w-[60px]"
            >
              <Search className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">Jobs</span>
            </button>
            
            <button
              onClick={() => navigate('/applied-jobs')}
              className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 transition-colors min-w-[60px]"
            >
              <Briefcase className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">Applied</span>
            </button>
            
            <button
              className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-colors min-w-[60px] text-blue-600"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">Messages</span>
            </button>
            
            <button
              onClick={() => navigate('/profile')}
              className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 transition-colors min-w-[60px]"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">Profile</span>
            </button>
          </div>
        </nav>
      )}

      {/* Bottom padding for mobile nav when on list view */}
      {!selectedConversation && <div className="lg:hidden h-16" />}
    </div>
  );
};

export default MessagesPage;

