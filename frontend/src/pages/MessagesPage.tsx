import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, LogOut, Search } from 'lucide-react';
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

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

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

      {/* Main Content - Full Width Messages Interface */}
      <main className="flex-1">
        {role === 'jobseeker' && (
          <div className="h-[calc(100vh-68px)] flex">
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
                  otherParticipantId={selectedConversation.companyId}
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
  );
};

export default MessagesPage;

