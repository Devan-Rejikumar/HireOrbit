import api from './axios';
import { ENV } from '../config/env';

const NOTIFICATION_API_BASE_URL = ENV.API_BASE_URL;
const NOTIFICATION_API_PATH = '/notifications';

export interface NotificationData {
  id: string;
  recipientId: string;
  type: 'APPLICATION_RECEIVED' | 'STATUS_UPDATED' | 'APPLICATION_WITHDRAWN' | 'INTERVIEW_CONFIRMED' | 'INTERVIEW_DECISION';
  title: string;
  message: string;
  data: {
    applicationId: string;
    jobId: string;
    applicantName?: string;
    jobTitle?: string;
    oldStatus?: string;
    newStatus?: string;
  };
  read: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationResponse {
  success: boolean;
  data: NotificationData[];
  message: string;
}

export interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
  message: string;
}

export const _notificationService = {
  getNotifications: async (recipientId: string): Promise<NotificationData[]> => {
    const response = await api.get<NotificationResponse>(`${NOTIFICATION_API_BASE_URL}${NOTIFICATION_API_PATH}/${recipientId}`);
    return response.data.data;
  },
  getNotificationsPaginated: async (recipientId: string, page: number = 1, limit: number = 10) => {
    const response = await api.get(`${NOTIFICATION_API_BASE_URL}${NOTIFICATION_API_PATH}/${recipientId}/paginated`, {
      params: { page, limit },
    });
    return response.data;
  },
  getUnreadCount: async (recipientId: string): Promise<number> => {
    const response = await api.get<UnreadCountResponse>(`${NOTIFICATION_API_BASE_URL}${NOTIFICATION_API_PATH}/${recipientId}/unread-count`);
    return response.data.data.count;
  },
  markAsRead: async (notificationId: string) => {
    const response = await api.patch(`${NOTIFICATION_API_BASE_URL}${NOTIFICATION_API_PATH}/${notificationId}/read`);
    return response.data;
  },
  markAsUnread: async (notificationId: string) => {
    const response = await api.patch(`${NOTIFICATION_API_BASE_URL}${NOTIFICATION_API_PATH}/${notificationId}/unread`);
    return response.data;
  },
  markAllAsRead: async (recipientId: string) => {
    const response = await api.patch(`${NOTIFICATION_API_BASE_URL}${NOTIFICATION_API_PATH}/${recipientId}/mark-all-read`);
    return response.data;
  },
  deleteNotification: async (notificationId: string) => {
    const response = await api.delete(`${NOTIFICATION_API_BASE_URL}${NOTIFICATION_API_PATH}/${notificationId}`);
    return response.data;
  },
};