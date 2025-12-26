import api from './axios';

const API_BASE_URL = '/notifications';

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
    const response = await api.get<NotificationResponse>(`${API_BASE_URL}/${recipientId}`);
    return response.data.data;
  },
  getNotificationsPaginated: async (recipientId: string, page: number = 1, limit: number = 10) => {
    const response = await api.get(`${API_BASE_URL}/${recipientId}/paginated`, {
      params: { page, limit },
    });
    return response.data;
  },
  getUnreadCount: async (recipientId: string): Promise<number> => {
    const response = await api.get<UnreadCountResponse>(`${API_BASE_URL}/${recipientId}/unread-count`);
    return response.data.data.count;
  },
  markAsRead: async (notificationId: string) => {
    const response = await api.patch(`${API_BASE_URL}/${notificationId}/read`);
    return response.data;
  },
  markAsUnread: async (notificationId: string) => {
    const response = await api.patch(`${API_BASE_URL}/${notificationId}/unread`);
    return response.data;
  },
  markAllAsRead: async (recipientId: string) => {
    const response = await api.patch(`${API_BASE_URL}/${recipientId}/mark-all-read`);
    return response.data;
  },
  deleteNotification: async (notificationId: string) => {
    const response = await api.delete(`${API_BASE_URL}/${notificationId}`);
    return response.data;
  },
};