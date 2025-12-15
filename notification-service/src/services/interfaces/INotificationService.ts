import { INotificationDocument } from '../../models/NotificationModel';
import { CreateNotificationInput } from '../../types/notifications';
import { 
  ApplicationReceivedInput, 
  StatusUpdatedInput, 
  ApplicationWithdrawnInput,
  InterviewConfirmedInput,
  InterviewDecisionInput,
} from '../../dto/mappers/notification.mapper';

export interface INotificationService {
  createNotification(input: CreateNotificationInput): Promise<INotificationDocument>;
  getNotificationsByRecipient(recipientId: string): Promise<INotificationDocument[]>;
  getNotificationsPaginated(recipientId: string, page: number, limit: number): Promise<INotificationDocument[]>;
  getUnreadCount(recipientId: string): Promise<number>;
  markAsRead(notificationId: string): Promise<void>;
  markAsUnread(notificationId: string): Promise<void>;
  markAllAsRead(recipientId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  sendApplicationReceivedNotification(input: ApplicationReceivedInput): Promise<void>;
  sendStatusUpdatedNotification(input: StatusUpdatedInput): Promise<void>;
  sendApplicationWithdrawnNotification(input: ApplicationWithdrawnInput): Promise<void>;
  sendInterviewConfirmedNotification(input: InterviewConfirmedInput): Promise<void>;
  sendInterviewDecisionNotification(input: InterviewDecisionInput): Promise<void>;
}