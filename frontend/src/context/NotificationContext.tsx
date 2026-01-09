import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '../hooks/useNotifications';
import { useWebSocket } from '../hooks/useWebSocket';
import { NotificationData } from '../api/notificationService';

interface RealTimeNotificationData {
  type: 'APPLICATION_RECEIVED' | 'STATUS_UPDATED' | 'APPLICATION_WITHDRAWN';
  id: string;
  recipientId: string;
  data: {
    applicationId: string;
    jobId: string;
    applicantName?: string;
    jobTitle?: string;
    oldStatus?: string;
    newStatus?: string;
  };
  timestamp: string;
}

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  realTimeNotifications: RealTimeNotificationData[];
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
  recipientId,
}) => {
  const navigate = useNavigate();

  // Hooks must be called unconditionally (React rules)
  // The hooks themselves handle empty recipientId with enabled flags/guards
  const { data: notifications = [], isLoading, isError, error } = useNotifications(recipientId || '');
  const { isConnected, realTimeNotifications, joinRoom, leaveRoom } = useWebSocket(recipientId || '');
  const { data: unreadCount = 0 } = useUnreadCount(recipientId || '');
 
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();

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
        readAt: undefined,
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
    case 'INTERVIEW_CONFIRMED':
      return 'Interview Confirmed';
    case 'INTERVIEW_DECISION':
      return 'Interview Result';
    default:
      return 'Notification';
    }
  };

  const getNotificationMessage = (notification: RealTimeNotificationData | NotificationData) => {
    // Check if it's a NotificationData (has message property)
    const hasMessage = 'message' in notification;
    const message = hasMessage ? (notification as NotificationData).message : undefined;
    
    switch (notification.type) {
    case 'APPLICATION_RECEIVED':
      return `${notification.data.applicantName || 'Someone'} applied for ${notification.data.jobTitle || 'a job'}`;
    case 'STATUS_UPDATED':
      const jobTitle = notification.data.jobTitle || 'Application';
      const newStatus = notification.data.newStatus || 'unknown';
      return `${jobTitle} status has been changed to ${newStatus}`;
    case 'APPLICATION_WITHDRAWN':
      return `${notification.data.applicantName || 'Someone'} withdrew their application`;
    case 'INTERVIEW_CONFIRMED':
      const interviewJobTitle = notification.data.jobTitle || (message ? message.split('for ')[1]?.split(' has')[0] : undefined) || 'the position';
      return message || `Your interview for ${interviewJobTitle} has been confirmed`;
    case 'INTERVIEW_DECISION':
      return message || 'Interview decision has been made';
    default:
      return message || 'New notification';
    }
  };

  const markAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };


  const deleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };


  const markAllAsRead = useCallback(() => {
    if (unreadCount > 0 && recipientId) {
      markAllAsReadMutation.mutate(recipientId);
    }
  }, [unreadCount, recipientId, markAllAsReadMutation]);

 
  const handleNotificationClick = useCallback((notification: NotificationData) => {
    // Mark notification as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'STATUS_UPDATED') {
      // Navigate to profile page with applied jobs tab
      navigate('/profile#applied-jobs');
    } else if (
      notification.type === 'INTERVIEW_CONFIRMED') {
      // Navigate to schedule page for interview details
      navigate('/schedule');
    } else if (notification.type === 'INTERVIEW_DECISION') {
      // Navigate to applied jobs page to see the decision
      navigate('/applied-jobs');
    } else if (notification.type === 'APPLICATION_RECEIVED') {
      // For companies, navigate to company applications
      navigate('/company/applications');
    } else if (notification.type === 'APPLICATION_WITHDRAWN') {
      // For companies, navigate to company applications
      navigate('/company/applications');
    } else {
      // Default: navigate to profile
      navigate('/profile');
    }
  }, [navigate, markAsRead]);


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
    leaveRoom,
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