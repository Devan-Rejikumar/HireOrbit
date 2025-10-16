import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, NotificationData } from '../api/notificationService';
export const useNotifications = (recipientId: string) => {
  return useQuery({
    queryKey: ['notifications', recipientId],
    queryFn: () => notificationService.getNotifications(recipientId),
    enabled: !!recipientId,
    refetchInterval: 30000, 
  });
};

export const useNotificationsPaginated = (recipientId: string, page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['notifications', recipientId, 'paginated', page, limit],
    queryFn: () => notificationService.getNotificationsPaginated(recipientId, page, limit),
    enabled: !!recipientId,
  });
};

export const useUnreadCount = (recipientId: string) => {
  return useQuery({
    queryKey: ['notifications', recipientId, 'unread-count'],
    queryFn: () => notificationService.getUnreadCount(recipientId),
    enabled: !!recipientId,
    refetchInterval: 10000,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: (data, notificationId) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

export const useMarkAsUnread = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationService.markAsUnread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationService.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};