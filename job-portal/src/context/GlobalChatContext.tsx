import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { useUserConversations, useCompanyConversations } from '@/hooks/useChat';
import { MessageResponse } from '@/api/_chatService';

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
    const chatServiceUrl = import.meta.env.VITE_CHAT_SERVICE_URL?.replace('/api/chat', '') || 'http://localhost:4007';
    
    // Only create socket if it doesn't exist
    if (!socketRef.current) {
      const newSocket = io(chatServiceUrl, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      newSocket.on('connect', () => {
        console.log('✅ Global chat WebSocket connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Global chat WebSocket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Global chat WebSocket connection error:', error);
        setIsConnected(false);
      });

      // Listen for new messages from ANY conversation
      newSocket.on('new-message', (message: MessageResponse) => {
        console.log('📨 New message received globally:', message);
        
        // Update React Query cache for messages
        queryClient.invalidateQueries({ queryKey: ['messages', message.conversationId] });
        
        // Update conversations list
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        
        // Update unread counts
        queryClient.invalidateQueries({ queryKey: ['total-unread-count'] });
        queryClient.invalidateQueries({ queryKey: ['conversations-with-unread'] });
        queryClient.invalidateQueries({ queryKey: ['unread-count'] });
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
          console.log(`✅ Joined conversation: ${conv.id}`);
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

