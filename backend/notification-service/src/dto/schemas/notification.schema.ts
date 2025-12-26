import { z } from 'zod';

export const createNotificationSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
  type: z.enum(['APPLICATION_RECEIVED', 'STATUS_UPDATED', 'APPLICATION_WITHDRAWN']),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  data: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
    jobId: z.string().optional(),
    status: z.string().optional(),
    applicantName: z.string().optional(),
    jobTitle: z.string().optional(),
  }),
});

export const getNotificationsSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
});

export const getNotificationsPaginatedSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const markAsReadSchema = z.object({
  notificationId: z.string().min(1, 'Notification ID is required'),
});

export const markAsUnreadSchema = z.object({
  notificationId: z.string().min(1, 'Notification ID is required'),
});

export const deleteNotificationSchema = z.object({
  notificationId: z.string().min(1, 'Notification ID is required'),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type GetNotificationsInput = z.infer<typeof getNotificationsSchema>;
export type GetNotificationsPaginatedInput = z.infer<typeof getNotificationsPaginatedSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type MarkAsUnreadInput = z.infer<typeof markAsUnreadSchema>;
export type DeleteNotificationInput = z.infer<typeof deleteNotificationSchema>;