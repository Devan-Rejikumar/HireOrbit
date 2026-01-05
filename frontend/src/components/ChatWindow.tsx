import { useState, useRef, useEffect, useMemo } from 'react';
import { MessageResponse } from '@/api/chatService';
import { useChatSocket } from '@/hooks/useChatSocket';
import { format } from 'date-fns';
import { User, Building2, Send, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import { TypingIndicator } from './TypingIndicator';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useBranding } from '@/context/BrandingContext';

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  messages: MessageResponse[];
  isLoading: boolean;
  onSendMessage?: () => void;
  otherParticipantName?: string;
  otherParticipantId?: string;
}

export const ChatWindow = ({
  conversationId,
  currentUserId,
  messages,
  isLoading,
  onSendMessage,
  otherParticipantName = 'User',
  otherParticipantId,
}: ChatWindowProps) => {
  const { role } = useAuth();
  const { settings } = useBranding();
  const [messageInput, setMessageInput] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingStateRef = useRef<boolean>(false);
  const { sendMessage, sendTyping, isConnected, typingUsers, onlineUsers, messages: socketMessages } = useChatSocket(conversationId, currentUserId);
  
  // Use cached user profile hook for companies
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useUserProfile(role === 'company' ? otherParticipantId : null);
  const userAvatar = userProfile?.profilePicture || userProfile?.avatar || null;
  
  // Additional debug: log if profile fetch failed
  useEffect(() => {
  }, [profileError]);
  
  // Reset avatar error when user changes
  useEffect(() => {
    setAvatarError(false);
  }, [otherParticipantId]);
  
  // Check if other participant is online
  const isOtherParticipantOnline = otherParticipantId ? onlineUsers[otherParticipantId] === true : false;
  
  // Check if other participant is typing
  const isOtherParticipantTyping = otherParticipantId ? typingUsers.has(otherParticipantId) : false;

  // Merge WebSocket messages with prop messages for real-time updates
  // WebSocket messages are the most up-to-date, so we prioritize them
  const allMessages = useMemo(() => {
    // Create a map of messages by ID for deduplication
    const messageMap = new Map<string, MessageResponse>();
    
    // Add prop messages first (from React Query cache)
    messages.forEach(msg => {
      messageMap.set(msg.id, msg);
    });
    
    // Add/update with WebSocket messages (real-time updates)
    socketMessages.forEach(msg => {
      messageMap.set(msg.id, msg);
    });
    
    // Convert back to array and sort by timestamp
    return Array.from(messageMap.values()).sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeA - timeB;
    });
  }, [messages, socketMessages]);

  // Fetch company logo when otherParticipantName changes (for jobseekers)
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      if (role !== 'jobseeker' || !otherParticipantName || otherParticipantName === 'User' || otherParticipantName === 'Company') {
        setCompanyLogo(null);
        setLogoError(false);
        return;
      }

      try {
        interface CompanyResponse {
          success?: boolean;
          data?: {
            company?: {
              logo?: string;
            };
          };
          company?: {
            logo?: string;
          };
        }
        
        const companyResponse = await api.get<CompanyResponse>(`/company/search?name=${encodeURIComponent(otherParticipantName)}`);
        const companyData = companyResponse.data?.data?.company || companyResponse.data?.company;
        
        if (companyData?.logo) {
          setCompanyLogo(companyData.logo);
          setLogoError(false);
        } else {
          setCompanyLogo(null);
          setLogoError(false);
        }
      } catch (error) {
        // Silent fail - use default icon
        setCompanyLogo(null);
        setLogoError(true);
      }
    };

    fetchCompanyLogo();
  }, [otherParticipantName, role]);

  // User avatar is now handled by useUserProfile hook (cached)

  // Auto-scroll to bottom when new messages arrive or typing indicator appears
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, isOtherParticipantTyping]);

  const handleSendMessage = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
    }
    if (!messageInput.trim() || !isConnected) return;

    // Stop typing indicator before sending message
    sendTyping(currentUserId, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }
    lastTypingStateRef.current = false;

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
    
    // Debounce typing events to prevent flickering (only send every 300ms)
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }
    
    typingDebounceRef.current = setTimeout(() => {
      const hasInput = messageInput.trim().length > 0;
      
      // Only update if state changed to prevent unnecessary events
      if (hasInput && !lastTypingStateRef.current) {
        // User started typing
        sendTyping(currentUserId, true);
        lastTypingStateRef.current = true;
      } else if (!hasInput && lastTypingStateRef.current) {
        // User cleared input
        sendTyping(currentUserId, false);
        lastTypingStateRef.current = false;
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        return;
      }
      
      // If user is typing, keep indicator active
      if (hasInput) {
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Stop typing indicator after 3 seconds of inactivity (like WhatsApp/Messenger)
        typingTimeoutRef.current = setTimeout(() => {
          sendTyping(currentUserId, false);
          lastTypingStateRef.current = false;
        }, 3000);
      }
    }, 300); // Debounce: wait 300ms before sending typing event
  };

  // Cleanup typing indicator on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
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
  const sortedMessages = allMessages;

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
    <div className="h-full flex flex-col bg-white relative">
      {/* Watermark - Site Logo */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 z-0" style={{ paddingBottom: '80px' }}>
        {settings?.logoUrl ? (
          <img
            src={settings.logoUrl}
            alt={settings.companyName || 'Company Logo'}
            className="h-32 w-auto opacity-5"
            onError={(e) => {
              // Fallback to text if image fails
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.fallback-watermark')) {
                const fallback = document.createElement('div');
                fallback.className = 'flex items-center gap-3 fallback-watermark';
                fallback.innerHTML = `
                  <div class="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <span class="text-white font-bold text-2xl">H</span>
                  </div>
                  <span class="text-4xl font-bold text-gray-900">${settings.companyName || 'Hire Orbit'}</span>
                `;
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
            <span className="text-4xl font-bold text-gray-900">{settings?.companyName || 'Hire Orbit'}</span>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white shadow-sm relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar with company logo or user avatar - show opposite of current user */}
            <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden">
              {role === 'jobseeker' && companyLogo && !logoError ? (
                <img 
                  src={companyLogo} 
                  alt={otherParticipantName} 
                  className="w-full h-full object-cover"
                  onError={() => {
                    setLogoError(true);
                  }}
                />
              ) : role === 'company' && userAvatar && !avatarError ? (
                <img 
                  src={userAvatar} 
                  alt={otherParticipantName} 
                  className="w-full h-full object-cover"
                  onError={() => {
                    setAvatarError(true);
                  }}
                  onLoad={() => {
                    // Image loaded successfully
                  }}
                />
              ) : (
                role === 'jobseeker' ? (
                  <Building2 className="w-5 h-5 text-gray-600" />
                ) : (
                  <User className="w-5 h-5 text-gray-600" />
                )
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{otherParticipantName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${isOtherParticipantOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-xs text-gray-500">{isOtherParticipantOnline ? 'Active now' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 relative z-10 hide-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : allMessages.length === 0 ? (
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
                      {/* Avatar for received messages - show company logo or user avatar */}
                      {!isOwnMessage && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {role === 'jobseeker' && companyLogo && !logoError ? (
                            <img 
                              src={companyLogo} 
                              alt={otherParticipantName} 
                              className="w-full h-full object-cover"
                              onError={() => setLogoError(true)}
                            />
                          ) : role === 'company' && userAvatar && !avatarError ? (
                            <img 
                              src={userAvatar} 
                              alt={otherParticipantName} 
                              className="w-full h-full object-cover"
                              onError={() => setAvatarError(true)}
                            />
                          ) : role === 'jobseeker' ? (
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
        
        {/* Typing Indicator - shown in chat area as a message bubble */}
        {isOtherParticipantTyping && (
          <div className="flex items-end gap-2 mb-4">
            {/* Avatar for typing indicator */}
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {role === 'jobseeker' && companyLogo && !logoError ? (
                <img 
                  src={companyLogo} 
                  alt={otherParticipantName} 
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : role === 'company' && userAvatar && !avatarError ? (
                <img 
                  src={userAvatar} 
                  alt={otherParticipantName} 
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : role === 'jobseeker' ? (
                <Building2 className="w-4 h-4 text-gray-600" />
              ) : (
                <User className="w-4 h-4 text-gray-600" />
              )}
            </div>
            
            {/* Typing indicator bubble */}
            <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2.5">
              <TypingIndicator />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 px-4 py-4 bg-white relative z-10">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-50 rounded-full border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <textarea
              ref={inputRef}
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                // Always trigger typing handler (it will handle empty input)
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
              disabled={!isConnected}
              rows={1}
              className="w-full px-5 py-3 resize-none focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed bg-transparent"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            type="button"
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

