import { useState, useEffect, useRef } from 'react';
import { ConversationResponse } from '@/api/_chatService';
import { formatDistanceToNow } from 'date-fns';
import { User, Building2, MessageCircle } from 'lucide-react';
import api from '@/api/axios';

interface ChatSidebarProps {
  conversations: ConversationResponse[];
  selectedConversationId: string | null;
  currentUserId: string;
  onSelectConversation: (conversation: ConversationResponse) => void;
  role: 'jobseeker' | 'company' | 'admin' | null;
}


export const ChatSidebar = ({
  conversations,
  selectedConversationId,
  currentUserId,
  onSelectConversation,
  role
}: ChatSidebarProps) => {
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const fetchedRef = useRef<Set<string>>(new Set());
  const fetchingRef = useRef(false);
  
  // Stable conversation IDs to track changes
  const conversationIds = conversations.map(c => c.id).join(',');

  // Simple: Only fetch names we don't have, with delays between requests
  useEffect(() => {
    if (!role || conversations.length === 0 || fetchingRef.current) return;

    const fetchNames = async () => {
      fetchingRef.current = true;
      const names: Record<string, string> = {};
      const toFetch = conversations.filter(c => !fetchedRef.current.has(c.id));

      for (let i = 0; i < toFetch.length; i++) {
        const conv = toFetch[i];
        if (fetchedRef.current.has(conv.id)) continue;

        // Delay between requests
        if (i > 0) await new Promise(r => setTimeout(r, 300));

        try {
          if (role === 'jobseeker') {
            // Comprehensive company name fetching (same as Chat.tsx header)
            let companyName: string | null = null;
            
            try {
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
              
              const appResponse = await api.get<ApplicationResponse>(`/applications/${conv.applicationId}`);
              const responseData = appResponse.data;
              const applicationData: ApplicationData | undefined = responseData?.data || (responseData as unknown as ApplicationData);
              
              // Extract company name from various possible locations
              companyName = applicationData?.companyName ||
                          applicationData?.job?.companyName ||
                          applicationData?.company?.companyName ||
                          (typeof applicationData?.job?.company === 'object' 
                            ? applicationData.job.company.companyName || applicationData.job.company.name 
                            : typeof applicationData?.job?.company === 'string' 
                              ? applicationData.job.company 
                              : null) ||
                          null;
              
              // If still not found, try fetching from job service using jobId
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
                  // Silent fail - continue with null
                }
              }
              
              if (companyName && companyName !== 'Company Name' && companyName !== 'Unknown Company') {
                names[conv.id] = companyName;
              } else {
                names[conv.id] = 'Company';
              }
            } catch (appError: any) {
              names[conv.id] = 'Company';
            }
          } else {
            const userRes = await api.get(`/users/${conv.userId}`);
            const userData = userRes.data?.data?.user || userRes.data?.user;
            const userName = userData?.username || userData?.name || 'User';
            names[conv.id] = userName;
          }
          fetchedRef.current.add(conv.id);
        } catch (error: any) {
          // Silent fail - use default name
          names[conv.id] = role === 'jobseeker' ? 'Company' : 'User';
          fetchedRef.current.add(conv.id);
        }
      }

      setParticipantNames(prev => ({ ...prev, ...names }));
      fetchingRef.current = false;
    };

    fetchNames();
  }, [conversationIds, role]);

  const getUnreadCount = (conversation: ConversationResponse): number => {
    return conversation.unreadCount[currentUserId] || 0;
  };

  const formatTime = (timestamp?: string): string => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const truncateMessage = (message: string | undefined | null, maxLength: number = 50): string => {
    // Handle undefined, null, or non-string values safely
    if (!message || typeof message !== 'string') return '';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <div className="h-full w-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conversation) => {
              const unreadCount = getUnreadCount(conversation);
              const isSelected = selectedConversationId === conversation.id;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar with icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                      {role === 'jobseeker' ? (
                        <Building2 className="w-6 h-6 text-gray-600" />
                      ) : (
                        <User className="w-6 h-6 text-gray-600" />
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm font-medium truncate ${
                          unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {participantNames[conversation.id] || `Application #${conversation.applicationId.substring(0, 8)}`}
                        </p>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      
                      {conversation.lastMessage ? (
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${
                            unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                          }`}>
                            {truncateMessage(conversation.lastMessage.content)}
                          </p>
                          {unreadCount > 0 && (
                            <span className="ml-2 flex-shrink-0 bg-blue-600 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No messages yet</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

