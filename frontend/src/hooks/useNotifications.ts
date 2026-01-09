import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { _notificationService, NotificationData } from '../api/notificationService';
export const useNotifications = (recipientId: string) => {
  return useQuery({
    queryKey: ['notifications', recipientId],
    queryFn: () => _notificationService.getNotifications(recipientId),
    enabled: !!recipientId,
    // No polling - rely on WebSocket for real-time updates
    refetchInterval: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    // Disable refetch on window focus to prevent loading bar from showing
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data on mount
  });
};

export const useNotificationsPaginated = (recipientId: string, page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['notifications', recipientId, 'paginated', page, limit],
    queryFn: () => _notificationService.getNotificationsPaginated(recipientId, page, limit),
    enabled: !!recipientId,
  });
};


export const useUnreadCount = (recipientId: string) => {
  return useQuery({
    queryKey: ['notifications', recipientId, 'unread-count'],
    queryFn: () => _notificationService.getUnreadCount(recipientId),
    enabled: !!recipientId,
    // No polling - rely on WebSocket for real-time updates
    refetchInterval: false,
    staleTime: 180000, // Consider data fresh for 3 minutes
    // Disable refetch on window focus to prevent loading bar from showing
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data on mount
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