import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotifications, useUnreadCount, useMarkAsRead, useDeleteNotification } from '../hooks/useNotifications';
import { useWebSocket } from '../hooks/useWebSocket';
import { NotificationData } from '../api/notificationService';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  realTimeNotifications: any[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  isConnected: boolean;
  
  // Actions
  markAsRead: (notificationId: string) => void;
  deleteNotification: (notificationId: string) => void;
  markAllAsRead: () => void;
  handleNotificationClick: (notification: NotificationData) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
  recipientId: string; 
}


export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  recipientId
}) => {

  const { data: notifications = [], isLoading, isError, error } = useNotifications(recipientId);
  const { data: unreadCount = 0 } = useUnreadCount(recipientId);
 
  const markAsReadMutation = useMarkAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const { isConnected, realTimeNotifications, joinRoom, leaveRoom } = useWebSocket(recipientId);

  const [allNotifications, setAllNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    if (notifications.length > 0) {
      setAllNotifications(notifications);
    }
  }, [notifications]);

  useEffect(() => {
    if (realTimeNotifications.length > 0) {
      const convertedNotifications = realTimeNotifications.map(rtNotification => ({
        id: rtNotification.id,
        recipientId: rtNotification.recipientId,
        type: rtNotification.type,
        title: getNotificationTitle(rtNotification.type),
        message: getNotificationMessage(rtNotification),
        data: rtNotification.data,
        read: false,
        createdAt: rtNotification.timestamp,
        readAt: undefined
      }));
      
      setAllNotifications(prev => [...convertedNotifications, ...prev]);
    }
  }, [realTimeNotifications]);

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'APPLICATION_RECEIVED':
        return 'New Application';
      case 'STATUS_UPDATED':
        return 'Status Update';
      case 'APPLICATION_WITHDRAWN':
        return 'Application Withdrawn';
      default:
        return 'Notification';
    }
  };

  const getNotificationMessage = (notification: any) => {
    switch (notification.type) {
      case 'APPLICATION_RECEIVED':
        return `${notification.data.applicantName} applied for ${notification.data.jobTitle}`;
      case 'STATUS_UPDATED':
        return `Your application status changed to ${notification.data.newStatus}`;
      case 'APPLICATION_WITHDRAWN':
        return `${notification.data.applicantName} withdrew their application`;
      default:
        return 'New notification';
    }
  };

  const markAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };


  const deleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };


  const markAllAsRead = () => {
    allNotifications.forEach(notification => {
      if (!notification.read) {
        markAsRead(notification.id);
      }
    });
  };

 
  const handleNotificationClick = (notification: NotificationData) => {
    console.log('Notification clicked:', notification);
  };


  const contextValue: NotificationContextType = {
    notifications: allNotifications,
    unreadCount,
    realTimeNotifications,
    isLoading,
    isError,
    error,
    isConnected,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    handleNotificationClick,
    joinRoom,
    leaveRoom
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};