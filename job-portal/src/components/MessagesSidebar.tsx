import React, { useState, useEffect } from 'react';
import { X, User, Building2, MessageCircle } from 'lucide-react';
import { ConversationResponse } from '@/api/chatService';
import { useCompanyConversations, useTotalUnreadCount } from '@/hooks/useChat';
import api from '@/api/axios';
import { formatDistanceToNow } from 'date-fns';

interface MessagesSidebarProps {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversation: ConversationResponse) => void;
}

export const MessagesSidebar: React.FC<MessagesSidebarProps> = ({
  companyId,
  isOpen,
  onClose,
  onSelectConversation
}) => {
  const { data: totalUnread = 0 } = useTotalUnreadCount(companyId);
  // Use useCompanyConversations to get ALL conversations (not just unread) so they remain visible after marking as read
  const { data: conversations = [], isLoading } = useCompanyConversations(companyId);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});

  // Fetch user names for all conversations
  useEffect(() => {
    const fetchUserNames = async () => {
      const names: Record<string, string> = {};
      
      for (const conversation of conversations) {
        try {
          const response = await api.get(`/users/${conversation.userId}`);
          const userName = response.data?.data?.user?.username ||
                          response.data?.data?.user?.name ||
                          'User';
          names[conversation.id] = userName;
        } catch (error) {
          console.error('Error fetching user name:', error);
          names[conversation.id] = 'User';
        }
      }
      
      setParticipantNames(names);
    };

    if (conversations.length > 0) {
      fetchUserNames();
    } else {
      setParticipantNames({});
    }
  }, [conversations]);

  const getUnreadCount = (conversation: ConversationResponse) => {
    return conversation.unreadCount[companyId] || 0;
  };

  const truncateMessage = (message: string, maxLength: number = 40) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sidebar */}
      <div className="relative ml-auto h-full w-full max-w-md bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Messages</h3>
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                {totalUnread}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages List */}
        <div className="overflow-y-auto h-[calc(100%-64px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-500">Loading messages...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">No messages yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((conversation) => {
                const unreadCount = getUnreadCount(conversation);
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      onSelectConversation(conversation);
                      onClose();
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar with icon */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>

                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-medium truncate ${
                            unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {participantNames[conversation.id] || 'User'}
                          </p>
                          {unreadCount > 0 && (
                            <span className="ml-2 flex-shrink-0 bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                              {unreadCount > 9 ? '9+' : unreadCount}
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
                            {conversation.lastMessage.timestamp && (
                              <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
                                {formatTime(conversation.lastMessage.timestamp)}
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
    </div>
  );
};


