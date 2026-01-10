import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { MessageResponse, ConversationResponse } from '@/api/chatService';
import { ENV } from '../config/env';

export interface TypingData {
  userId: string;
  isTyping: boolean;
}

export interface OnlineStatus {
  [userId: string]: boolean;
}

export const useChatSocket = (conversationId: string | null, currentUserId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<OnlineStatus>({});
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Clear messages when conversation changes
    setMessages([]);
    
    if (!conversationId) return;

    const chatSocketUrl = ENV.CHAT_SOCKET_URL;
    const newSocket = io(chatSocketUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      
      // Register user as online
      if (currentUserId) {
        newSocket.emit('register-user', { userId: currentUserId });
      }
      
      newSocket.emit('join-conversation', conversationId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('new-message', (message: MessageResponse) => {
      setMessages(prev => [...prev, message]);
      
      // Clear typing indicator when a new message arrives from the sender
      if (message.senderId !== currentUserId) {
        setTypingUsers(prev => {
          const updated = new Set(prev);
          updated.delete(message.senderId);
          return updated;
        });
      }
      
      // Optimize invalidations: only invalidate what's necessary
      // Update messages cache directly instead of invalidating
      queryClient.setQueryData(['messages', conversationId], (oldData: MessageResponse[] | undefined) => {
        if (!oldData) return [message];
        // Check if message already exists to prevent duplicates
        const exists = oldData.some(m => m.id === message.id);
        return exists ? oldData : [...oldData, message];
      });
      
      // Update conversations list directly (without refetch to prevent reloads)
      queryClient.setQueryData(['conversations'], (oldData: ConversationResponse[] | undefined) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        // Update the conversation's last message
        return oldData.map(conv => 
          conv.id === message.conversationId 
            ? { ...conv, lastMessage: message, lastMessageAt: message.createdAt }
            : conv,
        );
      });
      
      // Only invalidate unread counts if message is not from current user (without refetch)
      if (message.senderId !== currentUserId) {
        queryClient.invalidateQueries({ queryKey: ['total-unread-count'], refetchType: 'none' });
        queryClient.invalidateQueries({ queryKey: ['conversations-with-unread'], refetchType: 'none' });
      }
    });

    newSocket.on('user-typing', (data: TypingData) => {
      setTypingUsers(prev => {
        const updated = new Set(prev);
        if (data.isTyping) {
          updated.add(data.userId);
        } else {
          updated.delete(data.userId);
        }
        return updated;
      });
    });

    // Online status events
    newSocket.on('user-online', (data: { userId: string }) => {
      setOnlineUsers(prev => ({
        ...prev,
        [data.userId]: true,
      }));
    });

    newSocket.on('user-offline', (data: { userId: string }) => {
      setOnlineUsers(prev => ({
        ...prev,
        [data.userId]: false,
      }));
    });

    newSocket.on('message-error', () => {
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      if (conversationId) {
        newSocket.emit('leave-conversation', conversationId);
      }
      newSocket.close();
    };
  }, [conversationId, currentUserId, queryClient]);

  const sendMessage = (
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
  ) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('send-message', {
        conversationId,
        senderId,
        content,
        messageType,
      });
    }
  };

  const sendTyping = (userId: string, isTyping: boolean) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('typing', {
        conversationId,
        userId,
        isTyping,
      });
    }
  };

  const markAsRead = (userId: string) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('mark-as-read', {
        conversationId,
        userId,
      });
    }
  };

  return {
    socket,
    isConnected,
    messages,
    typingUsers,
    onlineUsers,
    sendMessage,
    sendTyping,
    markAsRead,
  };
};

