import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { _chatService, ConversationResponse, MessageResponse } from '@/api/chatService';

export const useUserConversations = (userId: string) => {
  return useQuery({
    queryKey: ['conversations', 'user', userId],
    queryFn: () => _chatService.getUserConversations(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    // No polling - rely on WebSocket for real-time updates
    refetchInterval: false,
    // Disable refetch on window focus to prevent reloads during chat/video calls
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data on mount
  });
};

export const useCompanyConversations = (companyId: string) => {
  return useQuery({
    queryKey: ['conversations', 'company', companyId],
    queryFn: () => _chatService.getCompanyConversations(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    // No polling - rely on WebSocket for real-time updates
    refetchInterval: false,
    // Disable refetch on window focus to prevent reloads during chat/video calls
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data on mount
  });
};

export const useConversation = (conversationId: string | null) => {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => _chatService.getConversation(conversationId!),
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data when switching conversations
    placeholderData: (previousData) => previousData, // Prevent loading state when switching
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
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 2000), // Exponential backoff: 1s, 2s
  });
};

export const useMessages = (conversationId: string | null, limit?: number, skip?: number) => {
  return useQuery({
    queryKey: ['messages', conversationId, limit, skip],
    queryFn: () => _chatService.getMessages(conversationId!, limit, skip),
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes (increased from 2)
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    // No polling - rely on WebSocket for real-time message updates
    refetchInterval: false,
    // Disable refetch on window focus to prevent reloads during chat/video calls
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if data exists in cache
    // Use placeholder data to prevent loading state when switching conversations
    placeholderData: (previousData) => previousData,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      _chatService.markAsRead(conversationId, userId),
    onSuccess: (_, variables) => {
      // Use refetchType: 'active' to update header badge when messages are read
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['conversations'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['total-unread-count'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['conversations-with-unread'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['unread-count'], refetchType: 'active' });
    },
  });
};


export const useUnreadCount = (conversationId: string | null, userId: string | null) => {
  return useQuery({
    queryKey: ['unread-count', conversationId, userId],
    queryFn: () => _chatService.getUnreadCount(conversationId!, userId!),
    enabled: !!conversationId && !!userId,
    // No polling - rely on WebSocket for real-time updates
    refetchInterval: false,
    staleTime: 120000, // Consider data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    // Disable refetch on window focus to prevent reloads during chat/video calls
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data if available
  });
};

export const useTotalUnreadCount = (userId: string | null) => {
  return useQuery({
    queryKey: ['total-unread-count', userId],
    queryFn: () => _chatService.getTotalUnreadCount(userId!),
    enabled: !!userId,
    // No polling - rely on WebSocket for real-time updates
    refetchInterval: false,
    staleTime: 180000, // Consider data fresh for 3 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    // Disable refetch on window focus to prevent reloads during chat/video calls
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data if available
  });
};

export const useConversationsWithUnread = (userId: string | null) => {
  return useQuery({
    queryKey: ['conversations-with-unread', userId],
    queryFn: () => _chatService.getConversationsWithUnread(userId!),
    enabled: !!userId,
    // No polling - rely on WebSocket for real-time updates
    refetchInterval: false,
    staleTime: 120000, // Consider data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    // Disable refetch on window focus to prevent reloads during chat/video calls
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data if available
  });
};

