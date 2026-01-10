import axios from 'axios';
import { ENV } from '../config/env';
import { API_ROUTES } from '../constants/apiRoutes';

// Create a separate axios instance for notification service
const notificationApi = axios.create({
  baseURL: `${ENV.NOTIFICATION_SERVICE_URL}/api/notifications`,
  withCredentials: true,
});

// Add auth token interceptor
notificationApi.interceptors.request.use(
  (config) => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
    const token = tokenCookie ? tokenCookie.split('=')[1] : null;
    
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (!(config.data instanceof FormData)) {
      config.headers = config.headers ?? {};
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => Promise.reject(error),
);

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
    const response = await notificationApi.get<NotificationResponse>(API_ROUTES.NOTIFICATIONS.GET_BY_RECIPIENT(recipientId));
    return response.data.data;
  },
  getNotificationsPaginated: async (recipientId: string, page: number = 1, limit: number = 10) => {
    const response = await notificationApi.get(API_ROUTES.NOTIFICATIONS.GET_PAGINATED(recipientId), {
      params: { page, limit },
    });
    return response.data;
  },
  getUnreadCount: async (recipientId: string): Promise<number> => {
    const response = await notificationApi.get<UnreadCountResponse>(API_ROUTES.NOTIFICATIONS.UNREAD_COUNT(recipientId));
    return response.data.data.count;
  },
  markAsRead: async (notificationId: string) => {
    const response = await notificationApi.patch(API_ROUTES.NOTIFICATIONS.MARK_AS_READ(notificationId));
    return response.data;
  },
  markAsUnread: async (notificationId: string) => {
    const response = await notificationApi.patch(API_ROUTES.NOTIFICATIONS.MARK_AS_UNREAD(notificationId));
    return response.data;
  },
  markAllAsRead: async (recipientId: string) => {
    const response = await notificationApi.patch(API_ROUTES.NOTIFICATIONS.MARK_ALL_AS_READ(recipientId));
    return response.data;
  },
  deleteNotification: async (notificationId: string) => {
    const response = await notificationApi.delete(API_ROUTES.NOTIFICATIONS.DELETE(notificationId));
    return response.data;
  },
};