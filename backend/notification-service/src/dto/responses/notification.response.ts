import { INotificationDocument } from '../../models/NotificationModel';

export interface NotificationResponse {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  data: {
    applicationId: string;
    jobId?: string;
    status?: string;
    applicantName?: string;
    jobTitle?: string;
  };
  read: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface UnreadCountResponse {
  count: number;
}

export class NotificationResponseMapper {
  static toResponse(notification: INotificationDocument): NotificationResponse {
    return {
      id: notification._id.toString(),
      recipientId: notification.recipientId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString(),
    };
  }

  static toListResponse(notifications: INotificationDocument[], total: number, page: number, limit: number): NotificationListResponse {
    return {
      notifications: notifications.map(notification => this.toResponse(notification)),
      total,
      page,
      limit,
    };
  }
}