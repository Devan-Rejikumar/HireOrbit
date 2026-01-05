/**
 * Notification Service Route Constants
 * All route paths for the notification service are defined here
 */

export const NOTIFICATION_ROUTES = {
  API_BASE_PATH: '/api/notifications',
  GET_NOTIFICATIONS: '/:recipientId',
  GET_NOTIFICATIONS_PAGINATED: '/:recipientId/paginated',
  GET_UNREAD_COUNT: '/:recipientId/unread-count',
  MARK_ALL_AS_READ: '/:recipientId/mark-all-read',
  MARK_AS_READ: '/:notificationId/read',
  MARK_AS_UNREAD: '/:notificationId/unread',
  DELETE_NOTIFICATION: '/:notificationId',
} as const;

