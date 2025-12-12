import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { MessageResponse } from '@/api/chatService';

export interface TypingData {
  userId: string;
  isTyping: boolean;
}

export const useChatSocket = (conversationId: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const chatServiceUrl = import.meta.env.VITE_CHAT_SERVICE_URL?.replace('/api/chat', '') || 'http://localhost:4007';
    const newSocket = io(chatServiceUrl, {
      transports: ['websocket'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-conversation', conversationId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('new-message', (message: MessageResponse) => {
      setMessages(prev => [...prev, message]);
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['total-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['conversations-with-unread'] });
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

    newSocket.on('message-error', (error: { error: string; details?: string }) => {
      console.error('Chat error:', error);
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      if (conversationId) {
        newSocket.emit('leave-conversation', conversationId);
      }
      newSocket.close();
    };
  }, [conversationId, queryClient]);

  const sendMessage = (
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text'
  ) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('send-message', {
        conversationId,
        senderId,
        content,
        messageType
      });
    }
  };

  const sendTyping = (userId: string, isTyping: boolean) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('typing', {
        conversationId,
        userId,
        isTyping
      });
    }
  };

  const markAsRead = (userId: string) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('mark-as-read', {
        conversationId,
        userId
      });
    }
  };

  return {
    socket,
    isConnected,
    messages,
    typingUsers,
    sendMessage,
    sendTyping,
    markAsRead
  };
};

