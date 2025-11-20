import { useState, useRef, useEffect } from 'react';
import { MessageResponse } from '@/api/_chatService';
import { useChatSocket } from '@/hooks/useChatSocket';
import { format } from 'date-fns';
import { User, Building2, Send, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  messages: MessageResponse[];
  isLoading: boolean;
  onSendMessage?: () => void;
  otherParticipantName?: string;
}

export const ChatWindow = ({
  conversationId,
  currentUserId,
  messages,
  isLoading,
  onSendMessage,
  otherParticipantName = 'User'
}: ChatWindowProps) => {
  const { role } = useAuth();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { sendMessage, sendTyping, isConnected } = useChatSocket(conversationId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !isConnected) return;

    sendMessage(currentUserId, messageInput.trim());
    setMessageInput('');
    inputRef.current?.focus();
    
    if (onSendMessage) {
      onSendMessage();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (!isConnected) return;
    
    sendTyping(currentUserId, true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(currentUserId, false);
    }, 2000);
  };

  // Cleanup typing indicator on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendTyping(currentUserId, false);
    };
  }, [currentUserId, sendTyping]);

  const formatMessageTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return format(date, 'HH:mm');
    } catch {
      return '';
    }
  };

  const formatMessageDate = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return format(date, 'MMM d, yyyy');
      }
    } catch {
      return '';
    }
  };

  // Sort messages chronologically (oldest first)
  const sortedMessages = [...messages].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateA - dateB;
  });

  // Group messages by date
  const groupedMessages = sortedMessages.reduce((groups, message) => {
    const date = formatMessageDate(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, MessageResponse[]>);

  // Sort messages within each date group (ensure chronological order)
  Object.keys(groupedMessages).forEach(date => {
    groupedMessages[date].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA - dateB;
    });
  });

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar with icon - show opposite of current user */}
            <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
              {role === 'jobseeker' ? (
                <Building2 className="w-5 h-5 text-gray-600" />
              ) : (
                <User className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{otherParticipantName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-xs text-gray-500">{isConnected ? 'Active now' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-lg">No messages yet</p>
              <p className="text-sm mt-2">Start the conversation!</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages)
            .sort(([dateA], [dateB]) => {
              // Sort dates chronologically
              // Handle special dates like "Today" and "Yesterday"
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              
              const getDateValue = (dateStr: string): number => {
                if (dateStr === 'Today') return today.getTime();
                if (dateStr === 'Yesterday') return yesterday.getTime();
                try {
                  return new Date(dateStr).getTime();
                } catch {
                  return 0;
                }
              };
              
              return getDateValue(dateA) - getDateValue(dateB);
            })
            .map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-200 px-3 py-1 rounded-full">
                  <span className="text-xs text-gray-600 font-medium">{date}</span>
                </div>
              </div>

              {/* Messages for this date */}
              {dateMessages.map((message) => {
                const isOwnMessage = message.senderId === currentUserId;
                // Check if message is read (the other participant has read it)
                const isRead = message.readBy && Array.isArray(message.readBy) && message.readBy.length > 0;
                
                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
                  >
                    {/* Avatar for received messages - show opposite icon of current user */}
                    {!isOwnMessage && (
                      <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                        {role === 'jobseeker' ? (
                          <Building2 className="w-4 h-4 text-gray-600" />
                        ) : (
                          <User className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                    )}
                    
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${
                      isOwnMessage
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                    }`}>
                      <p className="text-sm break-words leading-relaxed">{message.content}</p>
                      <div className={`flex items-center gap-1.5 mt-1.5 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {isOwnMessage && (
                          <div className="flex items-center">
                            {isRead ? (
                              <CheckCheck className="w-3.5 h-3.5" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Avatar for sent messages - show current user's icon */}
                    {isOwnMessage && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                        {role === 'jobseeker' ? (
                          <User className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Building2 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 px-4 py-4 bg-white">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-50 rounded-full border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <textarea
              ref={inputRef}
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                if (e.target.value.trim()) {
                  handleTyping();
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected}
              rows={1}
              className="w-full px-5 py-3 resize-none focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed bg-transparent"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || !isConnected || isLoading}
            className="w-11 h-11 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm hover:shadow-md disabled:hover:shadow-sm"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

