import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { INotificationService } from '../services/interfaces/INotificationService';
import { TYPES } from '../config/types';
import { StatusCodes } from '../enums/StatusCodes';
import { Messages } from '../constants/Messages';
import { buildSuccessResponse } from 'shared-dto';
import { 
  getNotificationsSchema, 
  getNotificationsPaginatedSchema, 
  markAsReadSchema, 
  markAsUnreadSchema, 
  deleteNotificationSchema 
} from '../dto/schemas/notification.schema';

@injectable()
export class NotificationController {
  constructor(
    @inject(TYPES.INotificationService) private _notificationService: INotificationService
  ) {}

  async getNotifications(req: Request, res: Response): Promise<void> {
    const { recipientId } = getNotificationsSchema.parse(req.params);
    const notifications = await this._notificationService.getNotificationsByRecipient(recipientId);
    
    res.status(StatusCodes.OK).json(
      buildSuccessResponse(notifications, Messages.NOTIFICATION.RETRIEVED_SUCCESS)
    );
  }

  async getNotificationsPaginated(req: Request, res: Response): Promise<void> {
    const { recipientId } = getNotificationsSchema.parse(req.params);
    const { page, limit } = getNotificationsPaginatedSchema.parse(req.query);
    
    const notifications = await this._notificationService.getNotificationsPaginated(recipientId, page, limit);
    
    res.status(StatusCodes.OK).json(
      buildSuccessResponse(
        {
          notifications,
          pagination: {
            page,
            limit,
            total: notifications.length
          }
        },
        Messages.NOTIFICATION.RETRIEVED_SUCCESS
      )
    );
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    const { recipientId } = getNotificationsSchema.parse(req.params);
    const count = await this._notificationService.getUnreadCount(recipientId);
    
    res.status(StatusCodes.OK).json(
      buildSuccessResponse({ count }, Messages.NOTIFICATION.UNREAD_COUNT_RETRIEVED)
    );
  }
  async markAsRead(req: Request, res: Response): Promise<void> {
    const { notificationId } = markAsReadSchema.parse(req.params);
    await this._notificationService.markAsRead(notificationId);
    
    res.status(StatusCodes.OK).json(
      buildSuccessResponse(null, Messages.NOTIFICATION.MARKED_AS_READ)
    );
  }

  async markAsUnread(req: Request, res: Response): Promise<void> {
    const { notificationId } = markAsUnreadSchema.parse(req.params);
    await this._notificationService.markAsUnread(notificationId);
    
    res.status(StatusCodes.OK).json(
      buildSuccessResponse(null, Messages.NOTIFICATION.MARKED_AS_UNREAD)
    );
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    const { recipientId } = getNotificationsSchema.parse(req.params);
    await this._notificationService.markAllAsRead(recipientId);
    
    res.status(StatusCodes.OK).json(
      buildSuccessResponse(null, Messages.NOTIFICATION.ALL_MARKED_AS_READ)
    );
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    const { notificationId } = deleteNotificationSchema.parse(req.params);
    await this._notificationService.deleteNotification(notificationId);
    
    res.status(StatusCodes.OK).json(
      buildSuccessResponse(null, Messages.NOTIFICATION.DELETED_SUCCESS)
    );
  }
}