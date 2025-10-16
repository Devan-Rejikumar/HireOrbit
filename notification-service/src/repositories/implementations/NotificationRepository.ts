import { Model } from 'mongoose';
import { BaseRepository } from './BaseRepository';
import { INotificationRepository } from '../interfaces/INotificationRepository';
import { INotificationDocument, NotificationModel } from '../../models/NotificationModel';

export class NotificationRepository extends BaseRepository<INotificationDocument> implements INotificationRepository {
  constructor() {
    super(NotificationModel);
  }

  async findByRecipientId(recipientId: string): Promise<INotificationDocument[]> {
    return await this.model.find({ recipientId }).sort({ createdAt: -1 });
  }

  async findByRecipientIdPaginated(recipientId: string, page: number, limit: number): Promise<INotificationDocument[]> {
    const skip = (page - 1) * limit;
    return await this.model
      .find({ recipientId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async getUnreadCount(recipientId: string): Promise<number> {
    return await this.model.countDocuments({ recipientId, read: false });
  }

  async markAsRead(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(id, { read: true, readAt: new Date() });
  }

  async markAsUnread(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(id, { read: false, readAt: null });
  }

  async findByType(recipientId: string, type: string): Promise<INotificationDocument[]> {
    return await this.model.find({ recipientId, type }).sort({ createdAt: -1 });
  }

  async deleteOldNotifications(olderThan: Date): Promise<void> {
    await this.model.deleteMany({ createdAt: { $lt: olderThan } });
  }
}