import { IBaseRepository } from './IBaseRepository';
import { INotificationDocument } from '../../models/NotificationModel';

export interface INotificationRepository extends IBaseRepository<INotificationDocument> {
  findByRecipientId(recipientId: string): Promise<INotificationDocument[]>;
  findByRecipientIdPaginated(recipientId: string, page: number, limit: number): Promise<INotificationDocument[]>;
  getUnreadCount(recipientId: string): Promise<number>;
  markAsRead(id: string): Promise<void>;
  markAsUnread(id: string): Promise<void>;
  findByType(recipientId: string, type: string): Promise<INotificationDocument[]>;
  deleteOldNotifications(olderThan: Date): Promise<void>;
}