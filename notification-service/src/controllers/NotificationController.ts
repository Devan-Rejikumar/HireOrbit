import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { INotificationService } from '../services/interfaces/INotificationService';
import { TYPES } from '../config/types';
import { StatusCodes, ErrorMessages, SuccessMessages } from '../enums/StatusCodes';
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
    @inject(TYPES.INotificationService) private notificationService: INotificationService
  ) {}

  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { recipientId } = getNotificationsSchema.parse(req.params);
      const notifications = await this.notificationService.getNotificationsByRecipient(recipientId);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: notifications,
        message: SuccessMessages.NOTIFICATIONS_RETRIEVED
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ErrorMessages.NOTIFICATION_RETRIEVAL_FAILED,
        error: errorMessage
      });
    }
  }

  async getNotificationsPaginated(req: Request, res: Response): Promise<void> {
    try {
      const { recipientId } = getNotificationsSchema.parse(req.params);
      const { page, limit } = getNotificationsPaginatedSchema.parse(req.query);
      
      const notifications = await this.notificationService.getNotificationsPaginated(recipientId, page, limit);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: notifications,
        message: SuccessMessages.NOTIFICATIONS_RETRIEVED,
        pagination: {
          page,
          limit,
          total: notifications.length
        }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ErrorMessages.NOTIFICATION_RETRIEVAL_FAILED,
        error: errorMessage
      });
    }
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const { recipientId } = getNotificationsSchema.parse(req.params);
      const count = await this.notificationService.getUnreadCount(recipientId);
      res.status(StatusCodes.OK).json({
        success: true,
        data: { count },
        message: SuccessMessages.UNREAD_COUNT_RETRIEVED
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ErrorMessages.UNREAD_COUNT_RETRIEVAL_FAILED,
        error: errorMessage
      });
    }
  }
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = markAsReadSchema.parse(req.params);
      await this.notificationService.markAsRead(notificationId);
      res.status(StatusCodes.OK).json({
        success: true,
        message: SuccessMessages.NOTIFICATION_MARKED_AS_READ
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ErrorMessages.MARK_AS_READ_FAILED,
        error: errorMessage
      });
    }
  }

  async markAsUnread(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = markAsUnreadSchema.parse(req.params);
      await this.notificationService.markAsUnread(notificationId);
      res.status(StatusCodes.OK).json({
        success: true,
        message: SuccessMessages.NOTIFICATION_MARKED_AS_UNREAD
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ErrorMessages.MARK_AS_UNREAD_FAILED,
        error: errorMessage
      });
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = deleteNotificationSchema.parse(req.params);
      await this.notificationService.deleteNotification(notificationId);
      res.status(StatusCodes.OK).json({
        success: true,
        message: SuccessMessages.NOTIFICATION_DELETED
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ErrorMessages.DELETE_NOTIFICATION_FAILED,
        error: errorMessage
      });
    }
  }
}