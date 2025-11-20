import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserConversations, useCompanyConversations, useMessages, useMarkAsRead, useConversationByApplication } from '@/hooks/useChat';
import { useQueryClient } from '@tanstack/react-query';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { ConversationResponse } from '@/api/chatService';
import api from '@/api/axios';

// Types for API responses
interface CompanyData {
  companyName: string;
  id: string;
}

interface CompanyApiResponse {
  success: boolean;
  data: {
    company: CompanyData;
  };
}

interface UserData {
  username?: string;
  name?: string;
  id: string;
}

interface UserApiResponse {
  success: boolean;
  data: {
    user: UserData;
  };
}

export const Chat = () => {
  const { user, company, role } = useAuth();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const [selectedConversation, setSelectedConversation] = useState<ConversationResponse | null>(null);
  const [otherParticipantName, setOtherParticipantName] = useState<string>('');
  const queryClient = useQueryClient();
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);

  const currentUserId = role === 'jobseeker' ? user?.id || '' : company?.id || '';

  const { data: conversationByApp, refetch: refetchConversation } = useConversationByApplication(applicationId || '');

  // Fetch participant name when conversation is selected
  useEffect(() => {
    const fetchOtherParticipantName = async () => {
      if (!selectedConversation) {
        setOtherParticipantName('');
        return;
      }

      try {
        // Determine which participant we need to fetch
        const otherParticipantId = role === 'jobseeker'
          ? selectedConversation.companyId
          : selectedConversation.userId;

        if (role === 'jobseeker') {
          // Try to get company name from application details first
          // The backend now fetches real company names from the job service
          let companyName: string | null = null;
          
          try {
            console.log(`📋 [Chat] Fetching application details for ${selectedConversation.applicationId}`);
            interface ApplicationData {
              companyName?: string;
              jobId?: string;
              company?: {
                companyName?: string;
              };
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
            console.log(`📋 [Chat] Application response:`, appResponse.data);
            
            // Try multiple possible response structures
            const responseData = appResponse.data;
            const applicationData: ApplicationData | undefined = responseData?.data || (responseData as unknown as ApplicationData);
            
            // Extract company name from various possible locations in the response
            companyName = applicationData?.companyName ||
                        applicationData?.job?.companyName ||
                        applicationData?.company?.companyName ||
                        (typeof applicationData?.job?.company === 'object' 
                          ? applicationData.job.company.companyName || applicationData.job.company.name 
                          : typeof applicationData?.job?.company === 'string' 
                            ? applicationData.job.company 
                            : null) ||
                        null;
            
            console.log(`📋 [Chat] Extracted company name:`, companyName);
            
            // If still not found, try fetching from job service using jobId as fallback
            if ((!companyName || companyName === 'Company Name' || companyName === 'Unknown Company') && applicationData?.jobId) {
              console.log(`📋 [Chat] Company name not in application, trying job service with jobId: ${applicationData.jobId}`);
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
                const responseData = jobResponse.data;
                const jobData = responseData?.data?.job || responseData?.job || responseData?.data || responseData;
                
                // Extract company name - company is a string in job response, not an object
                if (jobData && typeof jobData === 'object') {
                  companyName = (jobData as any)?.company?.companyName ||
                              (jobData as any)?.companyName ||
                              (jobData as any)?.company?.name ||
                              (typeof (jobData as any)?.company === 'string' ? (jobData as any)?.company : null) ||
                              null;
                }
                
                console.log(`📋 [Chat] Company name from job service:`, companyName);
              } catch (jobError: any) {
                console.error(`❌ [Chat] Error fetching job details:`, jobError);
              }
            }
            
            if (companyName && companyName !== 'Company Name' && companyName !== 'Unknown Company') {
              setOtherParticipantName(companyName);
              console.log(`✅ [Chat] Company name set: ${companyName}`);
              return;
            } else {
              console.warn(`⚠️ [Chat] Company name not found or invalid in application response`);
            }
          } catch (appError: any) {
            console.error(`❌ [Chat] Error fetching application details:`, appError);
            console.error(`❌ [Chat] Error response:`, appError.response?.data);
          }
          
          // Final fallback
          console.warn(`⚠️ [Chat] Using fallback 'Company' name`);
          setOtherParticipantName('Company');
        } else {
          // Fetch user name
          const response = await api.get<UserApiResponse>(`/users/${otherParticipantId}`);
          const userName = response.data?.data?.user?.username || 
                          response.data?.data?.user?.name || 
                          'User';
          setOtherParticipantName(userName);
        }
      } catch (error) {
        console.error('Error fetching participant name:', error);
        const fallbackName = role === 'jobseeker' ? 'Company' : 'User';
        setOtherParticipantName(fallbackName);
      }
    };

    fetchOtherParticipantName();
  }, [selectedConversation, role]);

  // Handle conversation selection from applicationId
  useEffect(() => {
    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (conversationByApp) {
      console.log('✅ [Chat] Conversation found:', conversationByApp.id);
      setSelectedConversation(conversationByApp);
      retryCountRef.current = 0;
      
      // Invalidate conversations list to refresh sidebar
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } else if (applicationId && !conversationByApp) {
      console.log('⏳ [Chat] Conversation not found for application:', applicationId);
      console.log('🔄 [Chat] Will attempt to refetch - backend should auto-create...');
      
      const maxRetries = 6; // Try 6 times with increasing delays
      
      const attemptRefetch = () => {
        if (retryCountRef.current >= maxRetries) {
          console.error('❌ [Chat] Failed to get/create conversation after all retries');
          return;
        }
        
        const delay = (retryCountRef.current + 1) * 500; // 500ms, 1000ms, 1500ms, etc.
        console.log(`🔄 [Chat] Refetch attempt ${retryCountRef.current + 1}/${maxRetries} in ${delay}ms...`);
        
        retryTimeoutRef.current = setTimeout(async () => {
          try {
            const result = await refetchConversation();
            if (result.data) {
              console.log('✅ [Chat] Conversation found after retry!');
              setSelectedConversation(result.data);
              
              // Invalidate conversations list to refresh sidebar
              queryClient.invalidateQueries({ queryKey: ['conversations'] });
              retryCountRef.current = 0;
            } else {
              retryCountRef.current++;
              attemptRefetch();
            }
          } catch (error) {
            console.error('❌ [Chat] Error refetching conversation:', error);
            retryCountRef.current++;
            if (retryCountRef.current < maxRetries) {
              attemptRefetch();
            } else {
              console.error('❌ [Chat] Failed to get/create conversation after all retries');
            }
          }
        }, delay);
      };
      
      // Reset retry count when applicationId changes
      retryCountRef.current = 0;
      attemptRefetch();
    }
    
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [conversationByApp, applicationId, refetchConversation, queryClient]);
  
  const {
    data: userConversations = [],
    isLoading: userLoading
  } = useUserConversations(user?.id || '');

  const {
    data: companyConversations = [],
    isLoading: companyLoading
  } = useCompanyConversations(company?.id || '');

  const conversations = role === 'jobseeker' ? userConversations : companyConversations;
  const isLoading = role === 'jobseeker' ? userLoading : companyLoading;

  const {
    data: messages = [],
    isLoading: messagesLoading
  } = useMessages(selectedConversation?.id || null);

  const markAsReadMutation = useMarkAsRead();

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
    
  };

  if (!role || (!user && !company)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Please log in to access chat</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar - 1/3 width */}
      <div className="w-1/3 border-r border-gray-200">
        <ChatSidebar
          conversations={conversations}
          selectedConversationId={selectedConversation?.id || null}
          currentUserId={currentUserId}
          onSelectConversation={handleSelectConversation}
          role={role}
        />
      </div>

      {/* Chat Window - 2/3 width */}
      <div className="flex-1">
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
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-primary to-purple-secondary flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

