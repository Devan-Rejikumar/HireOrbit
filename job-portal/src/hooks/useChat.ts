import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { _chatService, ConversationResponse, MessageResponse } from '@/api/chatService';

export const useUserConversations = (userId: string) => {
  return useQuery({
    queryKey: ['conversations', 'user', userId],
    queryFn: () => _chatService.getUserConversations(userId),
    enabled: !!userId,
    refetchInterval: 30000
  });
};

export const useCompanyConversations = (companyId: string) => {
  return useQuery({
    queryKey: ['conversations', 'company', companyId],
    queryFn: () => _chatService.getCompanyConversations(companyId),
    enabled: !!companyId,
    refetchInterval: 30000
  });
};

export const useConversation = (conversationId: string | null) => {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => _chatService.getConversation(conversationId!),
    enabled: !!conversationId
  });
};

export const useConversationByApplication = (applicationId: string) => {
  return useQuery({
    queryKey: ['conversation', 'application', applicationId],
    queryFn: async () => {
      const conversation = await _chatService.getConversationByApplication(applicationId);
      return conversation;
    },
    enabled: !!applicationId,
    retry: 2, // Retry 2 times (backend should auto-create on first attempt)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 2000) // Exponential backoff: 1s, 2s
  });
};

export const useMessages = (conversationId: string | null, limit?: number, skip?: number) => {
  return useQuery({
    queryKey: ['messages', conversationId, limit, skip],
    queryFn: () => _chatService.getMessages(conversationId!, limit, skip),
    enabled: !!conversationId
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      _chatService.markAsRead(conversationId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['total-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['conversations-with-unread'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    }
  });
};

// Helper to check if tab is visible (for pausing polling when inactive)
const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  return isVisible;
};

export const useUnreadCount = (conversationId: string | null, userId: string | null, isWebSocketConnected: boolean = false) => {
  const isVisible = usePageVisibility();
  
  return useQuery({
    queryKey: ['unread-count', conversationId, userId],
    queryFn: () => _chatService.getUnreadCount(conversationId!, userId!),
    enabled: !!conversationId && !!userId,
    // Only poll when WebSocket is disconnected AND tab is visible (as fallback)
    refetchInterval: (!isWebSocketConnected && isVisible) ? 60000 : false,
    staleTime: 30000, // Consider data fresh for 30s
    refetchOnWindowFocus: false,
    refetchOnMount: true // Always refetch on mount to get latest data
  });
};

export const useTotalUnreadCount = (userId: string | null, isWebSocketConnected: boolean = false) => {
  const isVisible = usePageVisibility();
  
  return useQuery({
    queryKey: ['total-unread-count', userId],
    queryFn: () => _chatService.getTotalUnreadCount(userId!),
    enabled: !!userId,
    // Only poll when WebSocket is disconnected AND tab is visible (as fallback)
    refetchInterval: (!isWebSocketConnected && isVisible) ? 60000 : false,
    staleTime: 30000, // Consider data fresh for 30s
    refetchOnWindowFocus: false,
    refetchOnMount: true // Always refetch on mount to get latest data
  });
};

export const useConversationsWithUnread = (userId: string | null, isWebSocketConnected: boolean = false) => {
  const isVisible = usePageVisibility();
  
  return useQuery({
    queryKey: ['conversations-with-unread', userId],
    queryFn: () => _chatService.getConversationsWithUnread(userId!),
    enabled: !!userId,
    // Only poll when WebSocket is disconnected AND tab is visible (as fallback)
    refetchInterval: (!isWebSocketConnected && isVisible) ? 60000 : false,
    staleTime: 30000, // Consider data fresh for 30s
    refetchOnWindowFocus: false,
    refetchOnMount: true // Always refetch on mount to get latest data
  });
};

