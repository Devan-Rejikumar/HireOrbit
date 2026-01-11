import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { useUserConversations, useCompanyConversations } from '@/hooks/useChat';
import { MessageResponse, ConversationResponse } from '@/api/chatService';
import { ENV } from '../config/env';
import { createSocketConnection } from '../utils/socketUtils';

interface GlobalChatContextType {
  isConnected: boolean;
}

const GlobalChatContext = createContext<GlobalChatContextType | undefined>(undefined);

interface GlobalChatProviderProps {
  children: React.ReactNode;
}

export const GlobalChatProvider: React.FC<GlobalChatProviderProps> = ({ children }) => {
  const { user, company, role, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const joinedConversationsRef = useRef<Set<string>>(new Set());

  // Get all conversations for the current user
  const currentUserId = role === 'jobseeker' ? user?.id : company?.id;
  const { data: userConversations = [] } = useUserConversations(role === 'jobseeker' ? (user?.id || '') : '');
  const { data: companyConversations = [] } = useCompanyConversations(role === 'company' ? (company?.id || '') : '');
  const allConversations = role === 'jobseeker' ? userConversations : companyConversations;

  // Setup WebSocket connection
  useEffect(() => {
    // Only connect if user is authenticated and has an ID
    if (!isAuthenticated || !currentUserId) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setIsConnected(false);
        joinedConversationsRef.current.clear();
      }
      return;
    }

    // Connect to chat service WebSocket
    const chatSocketUrl = ENV.CHAT_SOCKET_URL;
    console.log('🌐 Global Chat Socket connecting to:', chatSocketUrl);

    // Only create socket if it doesn't exist
    if (!socketRef.current) {
      const newSocket = createSocketConnection(chatSocketUrl, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      newSocket.on('connect', () => {
        console.log('[GlobalChat] WebSocket connected');
        setIsConnected(true);
        
        // Register user as online AND join their personal room for new-conversation events
        if (currentUserId) {
          newSocket.emit('register-user', { userId: currentUserId });
          // Also join the user's personal room to receive new-conversation notifications
          newSocket.emit('join-conversation', currentUserId);
          console.log('[GlobalChat] Registered user and joined personal room:', currentUserId);
          
          // Invalidate unread count queries on connect to ensure they fetch immediately
          // This ensures header badge updates work from the moment user logs in
          queryClient.invalidateQueries({ queryKey: ['total-unread-count', currentUserId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['conversations-with-unread', currentUserId], refetchType: 'active' });
        }
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('connect_error', () => {
        setIsConnected(false);
      });

      // Listen for new messages from ANY conversation
      newSocket.on('new-message', (message: MessageResponse) => {
        console.log('[GlobalChat] New message received:', message.conversationId);
        
        // Optimize: Update messages cache directly instead of invalidating
        queryClient.setQueryData(['messages', message.conversationId], (oldData: MessageResponse[] | undefined) => {
          if (!oldData) return [message];
          // Check if message already exists to prevent duplicates
          const exists = oldData.some(m => m.id === message.id);
          return exists ? oldData : [...oldData, message];
        });
        
        // Update conversations list (needed for last message update)
        // Use setQueryData instead of invalidate to avoid refetch during active chat
        queryClient.setQueryData(['conversations'], (oldData: ConversationResponse[] | undefined) => {
          if (!oldData) return oldData;
          // Update the conversation's last message
          return oldData.map(conv => 
            conv.id === message.conversationId 
              ? { ...conv, lastMessage: message, lastMessageAt: message.createdAt }
              : conv,
          );
        });
        
        // Also update conversations-with-unread cache to reflect new message
        queryClient.setQueryData(['conversations-with-unread', currentUserId], (oldData: ConversationResponse[] | undefined) => {
          if (!oldData) {
            // If cache doesn't exist, invalidate to trigger fetch
            queryClient.invalidateQueries({ queryKey: ['conversations-with-unread', currentUserId], refetchType: 'active' });
            return oldData;
          }
          // Update the conversation's last message and unread count
          return oldData.map(conv => {
            if (conv.id === message.conversationId) {
              const currentUnread = conv.unreadCount[currentUserId || ''] || 0;
              return {
                ...conv,
                lastMessage: message,
                lastMessageAt: message.createdAt,
                unreadCount: {
                  ...conv.unreadCount,
                  [currentUserId || '']: message.senderId !== currentUserId ? currentUnread + 1 : currentUnread,
                },
              };
            }
            return conv;
          });
        });
        
        // Invalidate and REFETCH unread counts so header updates in real-time
        // Use refetchType: 'active' to refetch queries that are currently being used
        // This ensures header badge updates immediately when messages arrive
        if (currentUserId) {
          queryClient.invalidateQueries({ queryKey: ['total-unread-count', currentUserId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['conversations-with-unread', currentUserId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['unread-count', message.conversationId], refetchType: 'active' });
        }
      });

      // Listen for messages-read event to update unread counts when user reads messages
      newSocket.on('messages-read', (data: { conversationId: string; userId: string }) => {
        console.log('[GlobalChat] Messages marked as read:', data.conversationId);
        
        // Update conversations-with-unread cache to reflect read status
        queryClient.setQueryData(['conversations-with-unread', data.userId], (oldData: ConversationResponse[] | undefined) => {
          if (!oldData) return oldData;
          // Update the conversation's unread count to 0
          return oldData.map(conv => {
            if (conv.id === data.conversationId) {
              return {
                ...conv,
                unreadCount: {
                  ...conv.unreadCount,
                  [data.userId]: 0,
                },
              };
            }
            return conv;
          });
        });
        
        // Refetch unread counts to update header badge
        queryClient.invalidateQueries({ queryKey: ['total-unread-count', data.userId], refetchType: 'active' });
        queryClient.invalidateQueries({ queryKey: ['conversations-with-unread', data.userId], refetchType: 'active' });
        queryClient.invalidateQueries({ queryKey: ['unread-count', data.conversationId], refetchType: 'active' });
      });

      // Listen for new conversation events (when status changes to SHORTLISTED)
      newSocket.on('new-conversation', (conversation: ConversationResponse) => {
        console.log('[GlobalChat] New conversation created:', conversation.id);
        
        // Join the new conversation room immediately
        newSocket.emit('join-conversation', conversation.id);
        joinedConversationsRef.current.add(conversation.id);
        
        // Invalidate conversations list to show the new conversation
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['conversations', 'user'] });
        queryClient.invalidateQueries({ queryKey: ['conversations', 'company'] });
        
        // Also invalidate unread count queries to ensure header updates
        if (currentUserId) {
          queryClient.invalidateQueries({ queryKey: ['total-unread-count', currentUserId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['conversations-with-unread', currentUserId], refetchType: 'active' });
        }
      });

      socketRef.current = newSocket;
    }

    // Cleanup on unmount
    return () => {
      // Don't close socket here - it should stay connected
      // Only close when user logs out (handled in separate effect)
    };
  }, [isAuthenticated, currentUserId, queryClient]);

  // Join conversations when they're available
  useEffect(() => {
    if (socketRef.current?.connected && allConversations.length > 0) {
      allConversations.forEach(conv => {
        if (!joinedConversationsRef.current.has(conv.id)) {
          socketRef.current!.emit('join-conversation', conv.id);
          joinedConversationsRef.current.add(conv.id);
        }
      });
    }
  }, [allConversations]);

  // Cleanup socket when user logs out
  useEffect(() => {
    if (!isAuthenticated && socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setIsConnected(false);
      joinedConversationsRef.current.clear();
    }
  }, [isAuthenticated]);

  return (
    <GlobalChatContext.Provider value={{ isConnected }}>
      {children}
    </GlobalChatContext.Provider>
  );
};

export const useGlobalChat = () => {
  const context = useContext(GlobalChatContext);
  if (context === undefined) {
    throw new Error('useGlobalChat must be used within a GlobalChatProvider');
  }
  return context;
};

