import { injectable, inject } from 'inversify';
import { INotificationService } from '../interfaces/INotificationService';
import { INotificationRepository } from '../../repositories/interfaces/INotificationRepository';
import { INotificationDocument } from '../../models/NotificationModel';
import { CreateNotificationInput } from '../../types/notifications';
import { TYPES } from '../../config/types';
import { 
  NotificationMapper, 
  ApplicationReceivedInput, 
  StatusUpdatedInput, 
  ApplicationWithdrawnInput 
} from '../../dto/mappers/notification.mapper';
import { io } from '../../server';

@injectable()
export class NotificationService implements INotificationService {
  constructor(
    @inject(TYPES.INotificationRepository) private _notificationRepository: INotificationRepository
  ) {}

  async createNotification(input: CreateNotificationInput): Promise<INotificationDocument> {
    return await this._notificationRepository.create(input);
  }

  async getNotificationsByRecipient(recipientId: string): Promise<INotificationDocument[]> {
    return await this._notificationRepository.findByRecipientId(recipientId);
  }

  async getNotificationsPaginated(recipientId: string, page: number, limit: number): Promise<INotificationDocument[]> {
    return await this._notificationRepository.findByRecipientIdPaginated(recipientId, page, limit);
  }

  async getUnreadCount(recipientId: string): Promise<number> {
    return await this._notificationRepository.getUnreadCount(recipientId);
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this._notificationRepository.markAsRead(notificationId);
  }

  async markAsUnread(notificationId: string): Promise<void> {
    await this._notificationRepository.markAsUnread(notificationId);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this._notificationRepository.delete(notificationId);
  }


async sendApplicationReceivedNotification(input: ApplicationReceivedInput): Promise<void> {
  const notificationData = NotificationMapper.toApplicationReceivedNotification(input);
  const notification = await this.createNotification(notificationData);
  io.to(input.companyId).emit('notification', {
    type: 'APPLICATION_RECEIVED',
    id: notification._id.toString(),
    recipientId: input.companyId,
    data: {
      applicationId: input.applicationId,
      jobId: input.jobId,
      applicantName: input.applicantName,
      jobTitle: input.jobTitle
    },
    timestamp: new Date().toISOString()
  });
  
  console.log('Application received notification created and sent via WebSocket:', notification.id);
}

async sendStatusUpdatedNotification(input: StatusUpdatedInput): Promise<void> {
  const notificationData = NotificationMapper.toStatusUpdatedNotification(input);
  const notification = await this.createNotification(notificationData);
  
  // Send WebSocket message to user
  io.to(input.userId).emit('notification', {
    type: 'STATUS_UPDATED',
    id: notification._id.toString(),
    recipientId: input.userId,
    data: {
      applicationId: input.applicationId,
      jobId: input.jobId,
      oldStatus: input.oldStatus,
      newStatus: input.newStatus
    },
    timestamp: new Date().toISOString()
  });
  
  console.log('Status updated notification created and sent via WebSocket:', notification.id);
}

async sendApplicationWithdrawnNotification(input: ApplicationWithdrawnInput): Promise<void> {
  const notificationData = NotificationMapper.toApplicationWithdrawnNotification(input);
  const notification = await this.createNotification(notificationData);
  io.to(input.companyId).emit('notification', {
    type: 'APPLICATION_WITHDRAWN',
    id: notification._id.toString(),
    recipientId: input.companyId,
    data: {
      applicationId: input.applicationId,
      jobId: input.jobId,
      applicantName: input.applicantName,
      jobTitle: input.jobTitle
    },
    timestamp: new Date().toISOString()
  });
  
  console.log('Application withdrawn notification created and sent via WebSocket:', notification.id);
}
}