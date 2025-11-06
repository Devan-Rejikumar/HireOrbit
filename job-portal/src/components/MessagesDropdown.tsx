import React, { useCallback } from 'react';
import { MessageSquare, Building2, User } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dropdown, DropdownContent, DropdownItem, DropdownHeader } from './ui/dropdown';
import { useConversationsWithUnread, useTotalUnreadCount } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ConversationResponse } from '@/api/chatService';
import api from '@/api/axios';
import { formatDistanceToNow } from 'date-fns';

interface MessagesDropdownProps {
  userId: string;
}

export const MessagesDropdown: React.FC<MessagesDropdownProps> = ({ userId }) => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { data: totalUnread = 0 } = useTotalUnreadCount(userId);
  const { data: conversations = [], isLoading } = useConversationsWithUnread(userId);
  const [participantNames, setParticipantNames] = React.useState<Record<string, string>>({});
  
  // Cache to track which conversations we've already fetched names for
  const fetchedNamesRef = React.useRef<Set<string>>(new Set());
  const isFetchingRef = React.useRef(false);
  
  // Create stable list of conversation IDs to track changes
  const conversationIds = React.useMemo(
    () => conversations.map(conv => conv.id).join(','),
    [conversations]
  );

  // Fetch participant names with caching and rate limiting
  React.useEffect(() => {
    // Skip if already fetching or no conversations
    if (isFetchingRef.current || conversations.length === 0) return;
    
    // Get conversations that need names fetched (only those not in cache)
    const conversationsToFetch = conversations.filter(
      conv => !fetchedNamesRef.current.has(conv.id)
    );
    
    if (conversationsToFetch.length === 0) return;
    
    isFetchingRef.current = true;
    
    const fetchParticipantNames = async () => {
      const names: Record<string, string> = { ...participantNames };
      
      // Process conversations with delays to avoid rate limiting
      for (let i = 0; i < conversationsToFetch.length; i++) {
        const conversation = conversationsToFetch[i];
        
        // Add delay between requests (except first one)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
        }
        
        // Skip if already fetched
        if (fetchedNamesRef.current.has(conversation.id)) continue;
        
        try {
          const otherParticipantId = role === 'jobseeker'
            ? conversation.companyId
            : conversation.userId;

          if (role === 'jobseeker') {
            // Fetch company name from application
            try {
              const appResponse = await api.get(`/applications/${conversation.applicationId}`);
              const applicationData = appResponse.data?.data || appResponse.data;
              
              let companyName = applicationData?.companyName ||
                              applicationData?.job?.company?.companyName ||
                              applicationData?.job?.companyName ||
                              applicationData?.company?.companyName ||
                              null;
              
              // Only fetch job if company name is missing
              if ((!companyName || companyName === 'Company Name') && applicationData?.jobId) {
                try {
                  await new Promise(resolve => setTimeout(resolve, 200)); // Delay before job fetch
                  const jobResponse = await api.get(`/jobs/${applicationData.jobId}`);
                  const jobData = jobResponse.data?.data?.job || jobResponse.data?.job || jobResponse.data?.data || jobResponse.data;
                  companyName = jobData?.company?.companyName ||
                              jobData?.companyName ||
                              jobData?.company?.name ||
                              jobData?.company ||
                              null;
                } catch (jobError: any) {
                  // Only log non-429 errors
                  if (jobError?.response?.status !== 429) {
                    console.error('Error fetching job details:', jobError);
                  }
                }
              }
              
              if (companyName && companyName !== 'Company Name' && companyName !== 'Unknown Company') {
                names[conversation.id] = companyName;
              } else {
                names[conversation.id] = 'Company';
              }
              fetchedNamesRef.current.add(conversation.id);
            } catch (appError: any) {
              // Only log non-429 errors
              if (appError?.response?.status !== 429) {
                console.error('Error fetching application details:', appError);
              }
              names[conversation.id] = 'Company';
              fetchedNamesRef.current.add(conversation.id);
            }
          } else {
            // Fetch user name
            const response = await api.get(`/users/${otherParticipantId}`);
            const userName = response.data?.data?.user?.username ||
                            response.data?.data?.user?.name ||
                            'User';
            names[conversation.id] = userName;
            fetchedNamesRef.current.add(conversation.id);
          }
        } catch (error: any) {
          // Only log non-429 errors
          if (error?.response?.status !== 429) {
            console.error('Error fetching participant name:', error);
          }
          names[conversation.id] = role === 'jobseeker' ? 'Company' : 'User';
          fetchedNamesRef.current.add(conversation.id);
        }
      }
      
      setParticipantNames(names);
      isFetchingRef.current = false;
    };

    fetchParticipantNames();
  }, [conversationIds, role]); // Use stable conversationIds instead of conversations array

  const getUnreadCount = (conversation: ConversationResponse) => {
    return conversation.unreadCount[userId] || 0;
  };

  const handleConversationClick = (conversation: ConversationResponse) => {
    navigate(`/chat?applicationId=${conversation.applicationId}`);
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="icon" className="relative">
          <MessageSquare className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </Button>
      }
      className="w-80"
    >
      <DropdownContent>
        <DropdownHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Messages</h3>
            {totalUnread > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                {totalUnread} unread
              </Badge>
            )}
          </div>
        </DropdownHeader>

        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <p>Loading messages...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No unread messages</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {conversations.map((conversation) => {
              const unreadCount = getUnreadCount(conversation);
              
              return (
                <DropdownItem
                  key={conversation.id}
                  className="flex flex-col items-start p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className="flex items-start gap-3 w-full">
                    {/* Avatar with icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                      {role === 'jobseeker' ? (
                        <Building2 className="w-5 h-5 text-gray-600" />
                      ) : (
                        <User className="w-5 h-5 text-gray-600" />
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm font-medium truncate ${
                          unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {participantNames[conversation.id] || (role === 'jobseeker' ? 'Company' : 'User')}
                        </p>
                        {unreadCount > 0 && (
                          <span className="ml-2 flex-shrink-0 bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      
                      {conversation.lastMessage && (
                        <div className="flex items-center justify-between">
                          <p className={`text-xs truncate ${
                            unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                          }`}>
                            {truncateMessage(conversation.lastMessage.content)}
                          </p>
                          {conversation.lastMessage.timestamp && (
                            <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </DropdownItem>
              );
            })}
          </div>
        )}

        {conversations.length > 0 && (
          <div className="p-2 border-t border-gray-200">
            <button
              onClick={() => navigate('/chat')}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
            >
              View all messages →
            </button>
          </div>
        )}
      </DropdownContent>
    </Dropdown>
  );
};


