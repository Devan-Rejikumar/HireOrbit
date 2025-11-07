import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { _notificationService, NotificationData } from '../api/_notificationService';
export const useNotifications = (recipientId: string) => {
  return useQuery({
    queryKey: ['notifications', recipientId],
    queryFn: () => _notificationService.getNotifications(recipientId),
    enabled: !!recipientId,
    refetchInterval: 30000, 
  });
};

export const useNotificationsPaginated = (recipientId: string, page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['notifications', recipientId, 'paginated', page, limit],
    queryFn: () => _notificationService.getNotificationsPaginated(recipientId, page, limit),
    enabled: !!recipientId,
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

export const useUnreadCount = (recipientId: string, isWebSocketConnected: boolean = false) => {
  const isVisible = usePageVisibility();
  
  return useQuery({
    queryKey: ['notifications', recipientId, 'unread-count'],
    queryFn: () => _notificationService.getUnreadCount(recipientId),
    enabled: !!recipientId,
    // Only poll when WebSocket is disconnected AND tab is visible (as fallback)
    refetchInterval: (!isWebSocketConnected && isVisible) ? 60000 : false,
    staleTime: 30000, // Consider data fresh for 30s
    refetchOnWindowFocus: false,
    refetchOnMount: true // Always refetch on mount to get latest data
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: _notificationService.markAsRead,
    onSuccess: (data, notificationId) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

export const useMarkAsUnread = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: _notificationService.markAsUnread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: _notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: _notificationService.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};